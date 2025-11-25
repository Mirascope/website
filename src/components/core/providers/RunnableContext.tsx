import { Observable, connectable } from "rxjs";
import {
  Component,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type HTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
} from "react";

import { type PyodideInterface, loadPyodide, version } from "pyodide";

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
  runPython: (code: string) => Promise<unknown>;
  /** Observe stdout */
  stdout: Observable<string> | null;
  /** Observe stderr */
  stderr: Observable<string> | null;
}

export interface ProviderProps extends PropsWithChildren {
  /**
   * URL to load Pyodide from
   * @default "https://cdn.jsdelivr.net/pyodide/v0.29.0/full/"
   */
  pyodideUrl?: string;
  /**
   * Props to pass to the error container element
   */
  errorContainerProps?: HTMLAttributes<HTMLDivElement>;
  /**
   * Props to pass to the error heading element
   */
  errorHeadingProps?: HTMLAttributes<HTMLHeadingElement>;
  /**
   * Props to pass to the error message element
   */
  errorMessageProps?: HTMLAttributes<HTMLPreElement>;
  /**
   * Custom error fallback component
   */
  errorFallback?: (error: Error) => ReactNode;
}

const RunnableContext = createContext<RunnableContextType | null>(null);

function Provider({ children, pyodideUrl = DEFAULT_PYODIDE_URL }: ProviderProps) {
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
        console.error((err as Error).message);
        setError(error);
      }
    }
    init();
  }, [pyodideUrl]);

  useEffect(() => {
    // Multiplex stdout and stderr to observables
    if (!pyodide) {
      return;
    }

    const stdoutDecoder = new TextDecoder("utf-8");
    const stdout$ = connectable(
      new Observable<string>((observer) =>
        pyodide.setStdout({
          write: (buffer: Uint8Array) => {
            const decoded = stdoutDecoder.decode(buffer, { stream: true });
            observer.next(decoded);
            return buffer.length;
          },
        })
      )
    );
    stdout$.connect();
    setStdout(stdout$);
    const stderrDecoder = new TextDecoder("utf-8");
    const stderr$ = connectable(
      new Observable<string>((observer) =>
        pyodide.setStderr({
          write: (buffer: Uint8Array) => {
            const decoded = stderrDecoder.decode(buffer, { stream: true });
            observer.next(decoded);
            return buffer.length;
          },
        })
      )
    );
    stderr$.connect();
    setStderr(stderr$);
  }, [pyodide]);

  useEffect(() => {
    if (!pyodide || error) {
      return;
    }

    const yamls = [
      "content/docs/mirascope/v2/examples/intro/decorator/async.py.yaml",
      "content/docs/mirascope/v2/examples/intro/decorator/async_stream.py.yaml",
      "content/docs/mirascope/v2/examples/intro/decorator/stream.py.yaml",
      "content/docs/mirascope/v2/examples/intro/decorator/sync.py.yaml",
      "content/docs/mirascope/v2/examples/intro/model/async.py.yaml",
      "content/docs/mirascope/v2/examples/intro/model/async_stream.py.yaml",
      "content/docs/mirascope/v2/examples/intro/model/stream.py.yaml",
      "content/docs/mirascope/v2/examples/intro/model/sync.py.yaml",
    ];

    async function bootstrap() {
      if (!pyodide) {
        return;
      }
      try {
        await pyodide.loadPackage("micropip");
        for (const yaml of yamls) {
          const baseDir = yaml.substring(0, yaml.lastIndexOf("/"));
          await pyodide.FS.mkdirTree(baseDir);
          const yamlURL = `${window.location.origin}/${yaml}`;
          const content = await fetch(yamlURL).then((res) => res.text());
          await pyodide.FS.writeFile(yaml, content);
        }
        // install dependencies
        const micropip = pyodide.pyimport("micropip");
        await micropip.install("vcrpy>=7.0.0");
        await micropip.install("mirascope[anthropic]==2.0.0a2");
        // pre-importing makes code blocks run faster
        await pyodide.runPythonAsync(`
          import vcr
          from mirascope import llm
        `);
        console.log("dependencies ready");
        setLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error((err as Error).message);
        setError(error);
      }
    }
    bootstrap();
  }, [pyodide, error, setError, setLoading]);

  const value = useMemo<RunnableContextType>(
    () => ({
      pyodide,
      loading,
      error,
      stdout,
      stderr,
      runPython: async (code: string) => {
        if (!pyodide || loading || error) {
          return;
        }
        try {
          await pyodide.runPythonAsync(code);
        } catch (err) {
          console.error((err as Error).message);
        }
      },
    }),
    [pyodide, loading, error, stdout, stderr]
  );

  return <RunnableContext.Provider value={value}>{children}</RunnableContext.Provider>;
}

const DEFAULT_ERROR_FALLBACK = (error: Error) => (
  <div className="pyodide-error">
    <h2>Failed to initialize Pyodide</h2>
    <pre>{error.message}</pre>
  </div>
);

export function RunnableProvider(props: ProviderProps) {
  const {
    errorContainerProps,
    errorHeadingProps,
    errorMessageProps,
    errorFallback = DEFAULT_ERROR_FALLBACK,
    ...rest
  } = props;

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Provider {...rest} />
    </ErrorBoundary>
  );
}

export function useRunnable() {
  const context = useContext(RunnableContext);
  if (!context) {
    throw new Error("useRunnable must be used within a RunnableProvider");
  }
  return context;
}

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error) => ReactNode);
  className?: string;
  errorClassName?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch() {
    // Error is handled by rendering the fallback UI
  }

  render() {
    const { error } = this.state;
    const { children, fallback, className, errorClassName } = this.props;

    if (error) {
      if (typeof fallback === "function") {
        return fallback(error);
      }
      return (
        fallback || (
          <section className={errorClassName} aria-label="Error message">
            <h2>Something went wrong</h2>
            <pre>{error.message}</pre>
          </section>
        )
      );
    }

    return <div className={className}>{children}</div>;
  }
}
