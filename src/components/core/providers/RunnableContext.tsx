import { Observable, bufferTime, connectable, map } from "rxjs";
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
  /** Install Python packages */
  installPackage: (pkg: string) => Promise<void>;
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
      setLoading(false);
      return;
    }

    // If initialization is already in progress, wait for it
    if (globalPyodidePromise) {
      globalPyodidePromise
        .then((pyodide) => {
          setPyodide(pyodide);
          setLoading(false);
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
        ANTHROPIC_API_KEY: "replace-via-reverse-proxy",
        ANTHROPIC_BASE_URL: `${window.location.origin}/anthropic`,
        OPENAI_API_KEY: "replace-via-reverse-proxy",
        OPENAI_BASE_URL: `${window.location.origin}/openai`,
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
        setLoading(false);
      } catch (err) {
        globalPyodidePromise = null;
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
      }
    }
    init();
  }, [pyodideUrl]);

  useEffect(() => {
    // Multiplex stdout and stderr to observables
    if (!pyodide || loading) {
      return;
    }
    const stdout$ = connectable(
      new Observable<string>((observer) =>
        pyodide.setStdout({
          raw: (c) => observer.next(String.fromCharCode(c)),
        })
      ).pipe(
        bufferTime(10),
        map((chunks) => chunks.join(""))
      )
    );
    stdout$.connect();
    setStdout(stdout$);
    const stderr$ = connectable(
      new Observable<string>((observer) =>
        pyodide.setStderr({
          raw: (c) => observer.next(String.fromCharCode(c)),
        })
      ).pipe(
        bufferTime(50),
        map((chunks) => chunks.join(""))
      )
    );
    stderr$.connect();
    setStderr(stderr$);
  }, [pyodide, loading]);

  useEffect(() => {
    if (!pyodide || loading || error) {
      return;
    }

    async function installDependencies() {
      if (!pyodide) {
        return;
      }
      try {
        // Optionally load built-in packages
        // await pyodide.loadPackage(["numpy", "matplotlib"]);
        await pyodide.loadPackage("micropip");
        const micropip = pyodide.pyimport("micropip");
        await micropip.install("mirascope[anthropic]==2.0.0a2", { keep_going: true });
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(error);
        setError(error);
      }
    }
    installDependencies();
  }, [pyodide, loading, error]);

  const value = useMemo<RunnableContextType>(
    () => ({
      pyodide,
      loading,
      error,
      stdout,
      stderr,
      installPackage: async (pkg: string) => {
        if (!pyodide) {
          return;
        }
        await pyodide.loadPackage(pkg);
      },
      runPython: async (code: string) => {
        if (!pyodide) {
          return;
        }
        // Let's not load arbitrary packages for now
        // await pyodide.loadPackagesFromImports(code);
        return pyodide.runPython(code);
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
