import { describe, test, expect, beforeEach } from "bun:test";
import { lastValueFrom, timer, of } from "rxjs";
import {
  getCassettePath,
  getCassetteUrl,
  transformPythonWithVcrDecorator,
  decompress,
  ReplayCassette,
} from "./vcr-cassettes";

describe("vcr-cassettes", () => {
  describe("getCassettePath", () => {
    test("converts standard path format to cassette path", () => {
      const path = "content/docs/mirascope/v2/examples/intro/decorator/sync.py";
      const result = getCassettePath(path);
      expect(result).toBe("cassettes/docs_mirascope_v2_examples_intro_decorator_sync.py.yaml");
    });

    test("handles Windows path separators", () => {
      const path = "content\\docs\\mirascope\\v2\\examples\\intro\\decorator\\sync.py";
      const result = getCassettePath(path);
      expect(result).toBe("cassettes/docs_mirascope_v2_examples_intro_decorator_sync.py.yaml");
    });

    test("handles deeply nested paths", () => {
      const path = "content/docs/mirascope/v2/examples/advanced/features/nested/example.py";
      const result = getCassettePath(path);
      expect(result).toBe(
        "cassettes/docs_mirascope_v2_examples_advanced_features_nested_example.py.yaml"
      );
    });

    test("handles single directory path", () => {
      const path = "content/example.py";
      const result = getCassettePath(path);
      expect(result).toBe("cassettes/example.py.yaml");
    });

    test("handles paths with special characters", () => {
      const path = "content/docs/mirascope/v2/examples/intro/tool-call/example.py";
      const result = getCassettePath(path);
      expect(result).toBe("cassettes/docs_mirascope_v2_examples_intro_tool-call_example.py.yaml");
    });
  });

  describe("getCassetteUrl", () => {
    let mockLocation: Location;

    beforeEach(() => {
      mockLocation = {
        origin: "https://example.com",
        pathname: "/docs/mirascope/v2",
      } as Location;
    });

    test("extracts filepath and constructs correct URL", () => {
      // The function resolves the filepath relative to the current page location
      // So if page is at /docs/mirascope/v2 and filepath is examples/intro/decorator/sync.py
      // it creates a nested URL then flattens it
      const code = '__filepath__ = "examples/intro/decorator/sync.py";\n\nprint("hello")';
      const result = getCassetteUrl(code, mockLocation).toString();
      const expected =
        "https://example.com/cassettes/docs_mirascope_v2_examples_intro_decorator_sync.py.yaml";
      // The nested path includes both the page path and the filepath, then gets flattened
      expect(result).toEqual(expected);
    });

    test("handles pathname with leading slash", () => {
      const code = '__filepath__ = "/examples/intro/decorator/sync.py";\n\nprint("hello")';
      const result = getCassetteUrl(code, mockLocation).toString();
      const expected =
        "https://example.com/cassettes/docs_mirascope_v2_examples_intro_decorator_sync.py.yaml";
      expect(result).toEqual(expected);
    });

    test("handles filepath with ./ prefix", () => {
      const code = '__filepath__ = "./examples/intro/decorator/sync.py";\n\nprint("hello")';
      const result = getCassetteUrl(code, mockLocation).toString();
      const expected =
        "https://example.com/cassettes/docs_mirascope_v2_examples_intro_decorator_sync.py.yaml";
      expect(result).toEqual(expected);
    });

    test("throws error when __filepath__ is missing", () => {
      const code = 'print("hello")';
      expect(() => getCassetteUrl(code, mockLocation)).toThrow("No __filepath__ found in code");
    });

    test("throws error when __filepath__ is empty", () => {
      const code = '__filepath__ = "";\n\nprint("hello")';
      expect(() => getCassetteUrl(code, mockLocation)).toThrow("No __filepath__ found in code");
    });
  });

  describe("transformPythonWithVcrDecorator", () => {
    test("adds decorator and import when main() exists and vcr not imported", () => {
      const code = `def main():
    print("hello")`;
      const yamlPath = "/path/to/cassette.yaml";
      const result = transformPythonWithVcrDecorator(code, yamlPath);
      expect(result).toContain("@vcr.use_cassette('/path/to/cassette.yaml')");
      expect(result).toContain("import vcr");
      expect(result).toContain("def main():");
    });

    test("preserves existing vcr import", () => {
      const code = `import vcr

def main():
    print("hello")`;
      const yamlPath = "/path/to/cassette.yaml";
      const result = transformPythonWithVcrDecorator(code, yamlPath);
      expect(result).toContain("@vcr.use_cassette('/path/to/cassette.yaml')");
      // Should only have one import vcr
      const importCount = (result.match(/^import vcr$/gm) || []).length;
      expect(importCount).toBe(1);
    });

    test("returns unchanged when no main() function", () => {
      const code = `def other_function():
    print("hello")`;
      const yamlPath = "/path/to/cassette.yaml";
      const result = transformPythonWithVcrDecorator(code, yamlPath);
      expect(result).toBe(code);
      expect(result).not.toContain("@vcr.use_cassette");
    });

    test("adds import at top when no imports exist", () => {
      const code = `def main():
    print("hello")`;
      const yamlPath = "/path/to/cassette.yaml";
      const result = transformPythonWithVcrDecorator(code, yamlPath);
      expect(result.startsWith("import vcr")).toBe(true);
    });

    test("adds import before first existing import", () => {
      const code = `from typing import List

def main():
    print("hello")`;
      const yamlPath = "/path/to/cassette.yaml";
      const result = transformPythonWithVcrDecorator(code, yamlPath);
      const lines = result.split("\n");
      const vcrImportIndex = lines.findIndex((line) => line.trim() === "import vcr");
      const typingImportIndex = lines.findIndex((line) => line.trim().startsWith("from typing"));
      expect(vcrImportIndex).toBeLessThan(typingImportIndex);
    });
  });

  describe("gunzip", () => {
    test("decompresses gzipped data to string", async () => {
      // Create a simple test string and gzip it
      const testString = "Hello, World!";
      const encoder = new TextEncoder();
      const data = encoder.encode(testString);

      // Use CompressionStream to create gzipped data
      const stream = new CompressionStream("gzip");
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(data);
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }

      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const gzippedData = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        gzippedData.set(chunk, offset);
        offset += chunk.length;
      }

      // Now test the gunzip operator
      const gunzip = decompress("gzip");
      const result = await lastValueFrom(gunzip(of(gzippedData)));
      expect(result).toBe(testString);
    });
  });

  describe("ReplayCassette", () => {
    const mockRequestCassette = `interactions:
  - request:
      body: '{"test": "data"}'
      headers:
        content-type:
          - application/json
      method: POST
      uri: https://api.example.com/test
    response:
      body:
        string: '{"content": [{"type": "text", "text": "Hello"}]}'
      headers:
        Content-Type:
          - application/json
source_sha256: abc123`;

    const mockStreamCassette = `interactions:
  - request:
      body: '{"test": "data"}'
      headers:
        content-type:
          - application/json
      method: POST
      uri: https://api.example.com/test
    response:
      body:
        string: |
          event: content_block_delta
          data: {"delta": {"text": "Hello"}}
          
          event: content_block_delta
          data: {"delta": {"text": " World"}}
      headers:
        Content-Type:
          - text/event-stream
source_sha256: def456`;

    const mockToolCallCassette = `interactions:
  - request:
      body: '{"test": "leads to tool call"}'
      headers:
        content-type:
          - application/json
      method: POST
      uri: https://api.example.com/test
    response:
      body:
        string: !!binary H4sIAAAAAAAAAwAAAP//dJFPT9wwEMW/ijWXXrxVwu6yXV8rtYBUpHLpASFrYg+JWWe8+A+wrPLdUUIjCqgna+b3PO+NfYQ+WPKgwHgslhYpMFNerBYn1cm6WtcrkOAsKOhTq6t6+/T8o/3VcnPx+PPyNx2+X22XGwsS8mFPo4pSwpZAQgx+bGBKLmXkDBJM4EycQV0fZ32mp5FMh4LzL94L05HZiccOs2hC2CWBkQQ+oPPYeBKORe5IeNdEjAeBbMeaRSQT+p7YChS9Y7toiK3jVgQmcRuiOITyFQb5Zh2C1yXRvOBYF13Vq8tlanZ39fPd2erPbUOl3nYbAxIY+2mjOYr+m0FPMccxvC8Z1HEYbiSkHPY6EqbA780mkOi+EBsCxcV7CWV6NXV8naFz2BEnUMtvGwkGTUfaRMLsAuv3imrmkdD+j813RwPad9RTRK/X/Wf9G627j3SQEEr+t3VaS0gUH5whnR1FUDD+tcVoYRheAAAA//8DAID1TLNcAgAA
      headers:
        Content-Type:
          - application/json
        Content-Encoding:
          - gzip
  - request:
      body: '{"test": "tool call response"}'
      headers:
        content-type:
          - application/json
      method: POST
      uri: https://api.example.com/test
    response:
      body:
        string: !!binary H4sIAAAAAAAAA3RUUWscRwz+K+q8GMxesJ24pPeWugQMKbjgh0JdDt2sble9Wc1a0vi8hPz3MrN2k7T0aZb5vpE+SZ/2c5hyTylsQ0xYetpYFiHfvNtcXVxdX1xfvgtd4D5sw2TD7uLyp5u3H37zvzLeHH//eBfH5Wr//pcldMGXmSqLzHCg0AXNqV6gGZujeOhCzOIkHrZ/fH7lOz1XpB3b8DMa9ZAFfCTAJ+SE+0Swz/lowOt14r2iLh3cnvUw8jCmBZRiniaSHs7PH8J9zvCJj9Ton3gYXViGhwD7BT70CHeYJtLzczhkBQTXkhaYWPrNnqRnGUAJ20nPMymTRHrzIA9yP7I1McAGKMASlXpuElPNng9gsfHhwNE5C6D0MI+csuV5XMDIXwu5uvYRIokXXd7ArcOB0IuSbWuuDXyAIvxYCARV0fmJwFxLrBw4sY9VQhGlxK1LKy0rnMYMPStFTwtg3yuZkbWctTDSGv0mT3Oi56/aOGKCni0WM85igPtcHAaSnrSDmmbgLB3MObFztK7VNpYJBaQpX1Uf0CILem3goTS1liOTL6vqQ1oqFFGtewm/ESqumCChDAUHWmPXIFk25uhksH81x/eSZ2WJPCcyUPSRFHxEgYHyoDiPSxX1a0leKZBwIbU6p2kxJ11aHqUnSi1Xfetw4pTgSDTDkgs8FrKKVdGnEf3MahtTjXun2epUlkTry54S70nRqVlq4mhw+d7HzcucIbFXuI1w5ETQE6YWubUGdfPSspgl0uy2+m7dAYgjpkQykFX8iaTqwgQ+shxrlHVmL+3ugPtKqV+1zCkrJvalGvCEi31T7EBSWKrougK1bG0bUX15tlrnwGr/ePeeVBFuB8mOYHVHbHUDGpyyQNRqEUyAMSbkqa0ae11ip5Qoeqluo7m5uAcWyU+vHs+6VBLL0LbuI7LCCbUOYAtc9SD0JEYdxBcXV1+v5Sg9FtYqx33tTwf74g08M6BnbGtRBwkTHsmAa8NA6YTalr616pu/wQ/hy59dMM/zTgktS9gGkn7nRSW8AEaPpa592EpJqQul/QS3nwPLXHzn+UhiYXt9cd2FiHGkXVRqjtt9z7h4xWtF/4e9vq0JaB5pIsW0u57+y/+KXo7/Rr90IRf/9urq7Y9dMPpbRWWZyanxJZmpRUpWSqCyOyWxKEWpthYAAAD//wMApjtNECwGAAA=
      headers:
        Content-Type:
          - application/json
        Content-Encoding:
          - gzip
source_sha256: 0cbeca`;

    describe("constructor", () => {
      test("parses request-type cassette correctly", () => {
        const cassette = new ReplayCassette(mockRequestCassette);
        expect(cassette.replayType).toBe("request");
        expect(cassette.sourceSha256).toBe("abc123");
      });

      test("identifies stream-type cassette from response headers", () => {
        const cassette = new ReplayCassette(mockStreamCassette);
        expect(cassette.replayType).toBe("stream");
        expect(cassette.sourceSha256).toBe("def456");
      });

      test("identifies request-type cassette from filename", () => {
        const cassette = new ReplayCassette(mockRequestCassette);
        expect(cassette.replayType).toBe("request");
        expect(cassette.sourceSha256).toBe("abc123");
      });
    });

    describe("play", () => {
      test("replays request-type cassette", async () => {
        const cassette = new ReplayCassette(mockRequestCassette);
        expect(cassette.replayType).toBe("request");
        const stream = cassette.play();
        const result = await lastValueFrom(stream);
        expect(result).toBe("Hello");
      });

      test("replays stream-type cassette", async () => {
        const cassette = new ReplayCassette(mockStreamCassette);
        expect(cassette.replayType).toBe("stream");
        const stream = cassette.play();
        const chunks: string[] = [];
        stream.subscribe({
          next: (chunk) => chunks.push(chunk),
        });
        await lastValueFrom(stream);
        expect(chunks).toEqual(["Hello", " World"]);
      });

      test("handles empty interactions", async () => {
        const emptyCassette = `interactions: []
source_sha256: empty123`;
        const cassette = new ReplayCassette(emptyCassette);
        const stream = cassette.play();
        try {
          const result = await lastValueFrom(stream);
          expect(result).toBeUndefined();
        } catch (error: any) {
          // Empty interactions result in EmptyError, which is expected
          expect(error.name).toBe("EmptyError");
        }
      });

      test("applies interaction delays", async () => {
        const cassette = new ReplayCassette(mockRequestCassette);
        const startTime = Date.now();
        const stream = cassette.play({
          delays: {
            interaction: () => timer(100),
          },
        });
        await lastValueFrom(stream);
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some margin
      });

      test("applies chunk delays", async () => {
        const cassette = new ReplayCassette(mockStreamCassette);
        const startTime = Date.now();
        const stream = cassette.play({
          delays: {
            chunk: () => timer(50),
          },
        });
        await lastValueFrom(stream);
        const elapsed = Date.now() - startTime;
        expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some margin
      });

      test("supports multiple subscribers", async () => {
        const cassette = new ReplayCassette(mockRequestCassette);
        const stream = cassette.play();

        const chunks1: string[] = [];
        const chunks2: string[] = [];

        stream.subscribe({ next: (chunk) => chunks1.push(chunk) });
        stream.subscribe({ next: (chunk) => chunks2.push(chunk) });

        await lastValueFrom(stream);
        expect(chunks1).toEqual(chunks2);
        expect(chunks1.length).toBe(1);
      });

      test("replays tool-call-type cassette", async () => {
        const cassette = new ReplayCassette(mockToolCallCassette);
        expect(cassette.replayType).toBe("request");
        const stream = cassette.play();

        const chunks: string[] = [];
        stream.subscribe({ next: (chunk) => chunks.push(chunk) });

        await lastValueFrom(stream);
        expect(chunks[0]).toStartWith("I'll check what books are available in the library ");
        expect(chunks[1]).toEqual("\n\n"); // tool call results into inserting a separator
        expect(chunks[2]).toStartWith("Based on the available books in the library");
      });
    });
  });
});
