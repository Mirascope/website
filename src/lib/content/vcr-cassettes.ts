import {
  from,
  concatMap,
  of,
  type Observable,
  type OperatorFunction,
  filter,
  map,
  delayWhen,
  timer,
  share,
} from "rxjs";
import yaml from "js-yaml";

export const VCRPY_CASSETTE_INTRO = "interactions:";

/**
 * Utilities for working with VCR.py cassettes and Python code transformation
 */

/**
 * Calculate the flat destination cassette path based on the original file path.
 *
 * Takes a relative path from the project root (e.g., "content/docs/mirascope/v2/examples/intro/decorator/async.py")
 * and converts it to a flat cassette path (e.g., "cassettes/docs_mirascope_v2_examples_intro_decorator_async.py.yaml")
 * by removing the first directory and joining the remaining parts with underscores.
 *
 * @param relativePath - Relative path from project root to the Python file
 * @returns The cassette path relative to the project root
 */
export function getCassettePath(relativePath: string): string {
  // Normalize path separators to forward slashes (works cross-platform)
  const normalizedPath = relativePath.replace(/\\/g, "/");
  const pathParts = normalizedPath.split("/");
  pathParts.shift(); // Remove the first directory

  const cassetteName = pathParts.join("_") + ".yaml";
  return `cassettes/${cassetteName}`;
}

/** Get VCR.py cassette URL for a given code example's contained filepath
 *
 * Example:
 * code = `__filepath__ = "content/docs/mirascope/v2/examples/intro/decorator/sync.py";\n\n...`
 * returns: `https://example.com/cassettes/docs_mirascope_v2_examples_intro_decorator_sync.py.yaml`
 *
 * @param code - The code example to get the VCR.py cassette URL for
 * @param location - The location of the current page (e.g. window.location)
 * @returns The VCR.py cassette URL
 */
export function getCassetteUrl(code: string, location: Location): URL {
  const filepath = code.match(/__filepath__ = "([^"]+)";/)?.[1] || "";
  if (!filepath) {
    throw new Error("No __filepath__ found in code");
  }

  // Normalize filepath: remove leading slash or "./" prefix
  const normalizedFilepath = filepath.replace(/^\.?\//, "");

  // Ensure base pathname ends with "/" so it's treated as a directory
  const basePathname = location.pathname.endsWith("/")
    ? location.pathname
    : location.pathname + "/";

  // Construct nested URL before flattening
  const nestedURL = new URL(basePathname, location.origin);
  const nestedPath = new URL(normalizedFilepath, nestedURL);

  // Flatten the nested URL to a flat path
  const flatPath = getCassettePath(nestedPath.pathname);
  const flatURL = new URL(flatPath, location.origin);

  return flatURL;
}

/**
 * Transform Python code to add VCR cassette decorator by injecting @vcr.use_cassette decorator
 * and ensuring the vcr import is present
 *
 * @param content - The Python code to transform
 * @param yamlPath - The path to the VCR.py cassette YAML file
 * @returns The transformed Python code
 */
export function transformPythonWithVcrDecorator(content: string, yamlPath: string): string {
  const lines = content.split("\n");

  // Check if vcr is already imported
  const hasVcrImport = lines.some((line) => line.trim().startsWith("import vcr"));

  // Find the main function
  const mainFuncIndex = lines.findIndex((line) => line.includes("def main():"));

  if (mainFuncIndex === -1) {
    // No main function found, return as-is
    return content;
  }

  const transformed = [...lines];

  // Add VCR decorator before main function
  transformed.splice(mainFuncIndex, 0, `@vcr.use_cassette('${yamlPath}')`);

  // Add import if not present
  if (!hasVcrImport) {
    // Find the first import or add at the top
    const firstImportIndex = transformed.findIndex(
      (line) => line.trim().startsWith("import ") || line.trim().startsWith("from ")
    );
    if (firstImportIndex !== -1) {
      transformed.splice(firstImportIndex, 0, "import vcr");
    } else {
      transformed.unshift("import vcr");
    }
  }

  return transformed.join("\n");
}

/**
 * Returns an RxJS operator that takes an Observable of Uint8Array<ArrayBuffer> and decompresses it using the Compression Streams API.
 * @param encoding - The encoding of the response body
 * @returns An OperatorFunction that maps Observable<Uint8Array<ArrayBuffer>> to Observable<string> containing the decoded response body.
 */
export function decompress(encoding: string): OperatorFunction<Uint8Array<ArrayBuffer>, string> {
  let compressionFormat: CompressionFormat = "gzip";
  if (encoding === "deflate") {
    compressionFormat = "deflate";
  }
  return concatMap(async (bytes: Uint8Array<ArrayBuffer>) => {
    // Decompress gzip using Compression Streams API
    const stream = new DecompressionStream(compressionFormat);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    writer.write(bytes);
    writer.close();

    // Read decompressed chunks
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        chunks.push(value);
      }
    }

    // Combine chunks and convert to string
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return new TextDecoder("utf-8").decode(result);
  });
}

type ResponseBody = {
  string: string;
};

type Interaction = {
  request: {
    body: string;
    headers: Record<string, string[]>;
    method: string;
    uri: string;
  };
  response: {
    body: ResponseBody;
    headers: Record<string, string[]>;
  };
};

type HttpEventLog = {
  raw: string;
  event: string | null;
  data: any;
};

type ReplayType = "request" | "stream";

type ReplayDelays = {
  delays?: {
    interaction?: (type: ReplayType) => Observable<number>;
    chunk?: (type: ReplayType) => Observable<number>;
  };
};

/**
 * ReplayCassette is a class that represents a VCR.py cassette and provides a method to play it back.
 * @param text - The text content of the cassette file
 * @returns A ReplayCassette instance
 */
export class ReplayCassette {
  private readonly HTTP_EVENT_LOG_INTRO = "event: ";
  private readonly type: ReplayType;
  private readonly cassette: any;
  private readonly interactions: Interaction[];
  private readonly sha256: string;

  constructor(text: string) {
    this.cassette = yaml.load(text);
    this.interactions = this.cassette.interactions;

    const isStream = this.interactions.some((interaction) =>
      interaction.response.headers["Content-Type"]?.some((v) => v.includes("text/event-stream"))
    );
    this.type = isStream ? "stream" : "request";

    this.sha256 = this.cassette.source_sha256;
  }

  public get sourceSha256(): string {
    return this.sha256;
  }

  private decompressBody(): OperatorFunction<Interaction, string> {
    return concatMap((interaction) => {
      const bodyStr = interaction.response.body.string;
      const encoding = interaction.response.headers["Content-Encoding"]?.[0] ?? "";

      // Response body is not string but gzipped Uint8Array
      if (typeof bodyStr !== "string" && encoding !== "") {
        return of(new Uint8Array(bodyStr)).pipe(decompress(encoding));
      }

      // Response body is not string but bytes array
      if (typeof bodyStr !== "string") {
        const decoder = new TextDecoder("utf-8");
        const decodedStr = decoder.decode(new Uint8Array(bodyStr));
        return of(decodedStr);
      }

      // Response body is string
      return of(bodyStr);
    });
  }

  private replayEventLog(): OperatorFunction<string, HttpEventLog> {
    return concatMap((responseBody: string) => {
      return from(responseBody.split("\n\n")).pipe(
        map((raw) => {
          const eventMatch = raw.match(/^event: (.+)$/m);
          const dataMatch = raw.match(/^data: (.+)$/ms);
          const event = eventMatch ? eventMatch[1] : null;
          let data = null;
          if (dataMatch) {
            try {
              data = JSON.parse(dataMatch[1]);
            } catch (err) {
              data = null;
            }
          }
          return {
            raw: raw,
            event,
            data: data,
          };
        })
      );
    });
  }

  private chunkBody(): OperatorFunction<string, string> {
    return concatMap((body: string) => {
      // Response body is an event log
      if (this.type === "stream" && body.startsWith(this.HTTP_EVENT_LOG_INTRO)) {
        return of(body).pipe(
          this.replayEventLog(),
          filter((log: HttpEventLog) => log.event === "content_block_delta"),
          map((log: HttpEventLog) => log.data.delta.text as string)
        );
      }

      if (this.type === "request" && body.trim()[0] === "{") {
        const jsonBody = JSON.parse(body);
        const chunks = jsonBody.content.map((content: { text: string; type: string }) => {
          switch (content.type) {
            case "tool_use":
              return "\n\n"; // markdown-compatible newline
            case "text":
              return content.text;
            default:
              // todo(sebastian): what to do with other content types?
              console.warn("Unhandled content type", content.type);
              return "";
          }
        });

        // Emit ordered chunks
        return from<string[]>(chunks);
      }

      // unknown invariant
      throw new Error("Response body type unknown");
    });
  }

  private sequentialDelay(
    delayer: (type: ReplayType) => Observable<number>
  ): OperatorFunction<string, string> {
    return concatMap((c) => of(c).pipe(delayWhen(() => delayer(this.type))));
  }

  /** Play the cassette from start to end with optional delays
   * @param delays - Optional delays to apply to the cassette
   * @returns An Observable of strings representing the cassette content
   * @example
   * const cassette = new ReplayCassette(new URL("https://example.com/cassette.yaml"));
   * const stream = cassette.play({
   *   delays: {
   *     interaction: (type) => timer(type === "request" ? 1000 : 0),
   *     chunk: (type) => timer(type === "request" ? 0 : 100),
   *   },
   * });
   * stream.subscribe((chunk) => console.log(chunk));
   */
  play({ delays }: ReplayDelays = {}): Observable<string> {
    // Default delayers are 0ms
    const interactionDelay = delays?.interaction ? delays.interaction : () => timer(0);
    const chunkDelay = delays?.chunk ? delays.chunk : () => timer(0);

    // pipeline internally uses concatMap because sequential timing and ordering is important
    const chunks: Observable<string> = from(this.interactions).pipe(
      this.decompressBody(),
      this.sequentialDelay(interactionDelay),
      this.chunkBody(),
      this.sequentialDelay(chunkDelay)
    );

    // mutlicast to all subscribers
    return chunks.pipe(share());
  }

  /** Create a ReplayCassette instance from a URL
   * @param url - The URL of the cassette file
   * @returns A ReplayCassette instance
   * @example
   * const cassette = await ReplayCassette.fromUrl(new URL("https://example.com/cassette.yaml"));
   * const stream = cassette.play();
   * stream.subscribe((chunk) => console.log(chunk));
   */
  static async fromUrl(url: URL): Promise<ReplayCassette | undefined> {
    try {
      const res = await fetch(url);

      if (!res.ok && res.status === 404) {
        return undefined;
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch cassette: ${res.statusText}`);
      }

      const text = await res.text();
      if (!text.startsWith(VCRPY_CASSETTE_INTRO)) {
        return undefined;
      }

      return new ReplayCassette(text);
    } catch (err) {
      // Let unexpected errors bubble up to the caller
      throw err;
    }
  }
}
