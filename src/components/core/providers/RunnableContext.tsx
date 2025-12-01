import { Observable, connectable, catchError, takeUntil, lastValueFrom, from, EMPTY } from "rxjs";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { type PyodideInterface, loadPyodide, version } from "pyodide";
import { transformPythonWithVcrDecorator } from "@/src/lib/content/vcr-cassettes";

const DEFAULT_PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`;

// Module-level singleton to share Pyodide instance across all Provider instances
let globalPyodidePromise: Promise<PyodideInterface> | null = null;
let globalPyodide: PyodideInterface | null = null;

export interface RunnableContextType {
  /** The Pyodide instance */
  pyodide: PyodideInterface | null;
  /** Whether Pyodide is loading */
  loading: boolean;
  /** Error loading Pyodide */
  error: Error | null;
  /** Run Python code */
  runPython: (code: string) => {
    done: () => Promise<any>;
    stdout: Observable<string>;
    stderr: Observable<string>;
  };
  /** Run Python code with VCR.py cassettes */
  runPythonWithVCR: (code: string) => Promise<{
    done: () => Promise<any>;
    stdout: Observable<string>;
    stderr: Observable<string>;
  }>;
  /** Get VCR.py cassette URL for a given code */
  getVCRCassetteUrl: (code: string) => string;
}

export interface ProviderProps extends PropsWithChildren {
  /**
   * URL to load Pyodide from
   * @default "https://cdn.jsdelivr.net/pyodide/v0.29.0/full/"
   */
  pyodideUrl?: string;
}

const RunnableContext = createContext<RunnableContextType | null>(null);

export function RunnableProvider({ children, pyodideUrl = DEFAULT_PYODIDE_URL }: ProviderProps) {
  const [pyodide, setPyodide] = useState<PyodideInterface | null>(globalPyodide);
  const [loading, setLoading] = useState(!globalPyodide);
  const [error, setError] = useState<Error | null>(null);
  const [stdout, setStdout] = useState<Observable<string> | null>(null);
  const [stderr, setStderr] = useState<Observable<string> | null>(null);

  useEffect(() => {
    // If we already have a global instance, use it
    if (globalPyodide) {
      setPyodide(globalPyodide);
      return;
    }

    // If initialization is already in progress, wait for it
    if (globalPyodidePromise) {
      globalPyodidePromise
        .then((pyodide) => {
          setPyodide(pyodide);
        })
        .catch((err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
        });
      return;
    }

    // Start new initialization
    async function init() {
      const env = {
        ANTHROPIC_API_KEY: "http-requests-are-cached",
      };
      try {
        const pyodidePromise = loadPyodide({
          indexURL: pyodideUrl,
          env,
        });
        globalPyodidePromise = pyodidePromise;
        const pyodide = await pyodidePromise;

        globalPyodide = pyodide;
        globalPyodidePromise = null;

        setPyodide(pyodide);
      } catch (err) {
        globalPyodidePromise = null;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
      }
    }
    init();
  }, [pyodideUrl]);

  useEffect(() => {
    if (!error) {
      return;
    }
    console.warn("failed to initialize runnable", error.message);
  }, [error]);

  // Multiplex stdout and stderr via observables
  useEffect(() => {
    if (!pyodide) {
      return;
    }

    const createStdioObservable = (
      setStream: (handler: { write: (buffer: Uint8Array) => number }) => void
    ) => {
      const decoder = new TextDecoder("utf-8");
      const stream$ = connectable(
        new Observable<string>((observer) =>
          setStream({
            write: (buffer: Uint8Array) => {
              const decoded = decoder.decode(buffer, { stream: true });
              observer.next(decoded);
              return buffer.length;
            },
          })
        )
      );
      stream$.connect();
      return stream$;
    };

    setStdout(createStdioObservable(pyodide.setStdout.bind(pyodide)));
    setStderr(createStdioObservable(pyodide.setStderr.bind(pyodide)));
  }, [pyodide]);

  useEffect(() => {
    if (!pyodide || error) {
      return;
    }

    // const yamls = [
    //   "content/docs/mirascope/v2/examples/intro/decorator/async.py.yaml",
    //   "content/docs/mirascope/v2/examples/intro/decorator/async_stream.py.yaml",
    //   "content/docs/mirascope/v2/examples/intro/decorator/stream.py.yaml",
    //   "content/docs/mirascope/v2/examples/intro/decorator/sync.py.yaml",
    //   "content/docs/mirascope/v2/examples/intro/model/async.py.yaml",
    //   "content/docs/mirascope/v2/examples/intro/model/async_stream.py.yaml",
    //   "content/docs/mirascope/v2/examples/intro/model/stream.py.yaml",
    //   "content/docs/mirascope/v2/examples/intro/model/sync.py.yaml",
    // ];

    async function bootstrap() {
      if (!pyodide || !loading || error) {
        return;
      }

      try {
        await pyodide.loadPackage("micropip");

        // for (const yaml of yamls) {
        //   const baseDir = yaml.substring(0, yaml.lastIndexOf("/"));
        //   await pyodide.FS.mkdirTree(baseDir);
        //   const yamlURL = `${window.location.origin}/${yaml}`;
        //   const content = await fetch(yamlURL).then((res) => res.text());
        //   await pyodide.FS.writeFile(yaml, content);
        // }

        // install dependencies
        const micropip = pyodide.pyimport("micropip");
        await micropip.install("vcrpy>=7.0.0");
        await micropip.install("mirascope[anthropic]==2.0.0a2");

        // pre-importing makes code blocks run faster
        await pyodide.runPythonAsync(`
          import vcr
          from mirascope import llm
        `);

        setLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
      }
    }
    bootstrap();
  }, [pyodide, error, loading]);

  const runPython = (code: string) => {
    if (!pyodide) {
      throw new Error("Pyodide is not ready");
    }

    if (loading || !stdout || !stderr) {
      console.warn("Pyodide is still loading");
      return {
        done: () => Promise.resolve(undefined),
        stdout: new Observable<string>((observer) => observer.complete()),
        stderr: new Observable<string>((observer) => observer.complete()),
      };
    }

    const done$ = from(pyodide.runPythonAsync(code));

    // Returns a promise with the result—if the last
    // Python statement is an expression (not ending
    // with a semicolon), Pyodide returns the value.
    const done = () => lastValueFrom(done$);

    // dedupe error and complete the run's stdout+stderr
    const complete$ = takeUntil<any>(done$.pipe(catchError(() => EMPTY)));
    const runStdout$ = stdout.pipe(complete$);
    const runStderr$ = stderr.pipe(complete$);

    return { done, stdout: runStdout$, stderr: runStderr$ };
  };

  const getVCRCassetteUrl = (code: string) => {
    // todo(sebastian): temporary since it only works in dev mode
    const filepath = code.match(/__filepath__ = "([^"]+)";/)?.[1] || "";
    const url = new URL(
      `/content${window.location.pathname}/${filepath}.yaml`,
      window.location.origin
    ).toString();

    return url;
  };

  const runPythonWithVCR = async (code: string) => {
    const cassetteURL = getVCRCassetteUrl(code);

    // Load VCR.py cassette into Pyodide FS
    const res = await fetch(cassetteURL);
    const cassette = await res.text();
    const baseDir = cassetteURL.substring(0, cassetteURL.lastIndexOf("/"));
    await pyodide!.FS.mkdirTree(baseDir);
    await pyodide!.FS.writeFile(cassetteURL, cassette);

    const transformedCode = transformPythonWithVcrDecorator(code, cassetteURL);

    const { done, stdout, stderr } = runPython(transformedCode);
    return {
      done,
      stdout,
      stderr,
    };
  };

  const value = useMemo<RunnableContextType>(
    () => ({
      pyodide,
      loading,
      error,
      runPython,
      runPythonWithVCR,
      getVCRCassetteUrl,
    }),
    [pyodide, loading, error, stdout, stderr]
  );

  return <RunnableContext.Provider value={value}>{children}</RunnableContext.Provider>;
}

export function useRunnable() {
  const context = useContext(RunnableContext);
  if (!context) {
    throw new Error("useRunnable must be used within a RunnableProvider");
  }
  return context;
}
