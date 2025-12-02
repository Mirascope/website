import { Observable, Subject } from "rxjs";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
  type PropsWithChildren,
} from "react";

import { type PyodideInterface, version } from "pyodide";
import { transformPythonWithVcrDecorator } from "@/src/lib/content/vcr-cassettes";
import type {
  WorkerRequest,
  WorkerResponse,
  WorkerStreamEvent,
} from "@/src/workers/pyodide-worker-types";

const VCRPY_CASSETTE_INTRO = "interactions:";
const DEFAULT_PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`;

// Module-level singleton to share Worker instance across all Provider instances
let globalWorkerPromise: Promise<Worker> | null = null;
let globalWorker: Worker | null = null;

// Track pending requests and their resolvers
const pendingRequests = new Map<
  string,
  {
    resolve: (response: WorkerResponse) => void;
    reject: (error: Error) => void;
  }
>();

// Stream subjects for stdout/stderr per execution
const streamSubjects = new Map<
  string,
  {
    stdout: Subject<string>;
    stderr: Subject<string>;
    done: Subject<void>;
  }
>();

/**
 * Create or get the global worker instance
 */
function getOrCreateWorker(pyodideUrl: string): Promise<Worker> {
  if (globalWorker) {
    return Promise.resolve(globalWorker);
  }

  if (globalWorkerPromise) {
    return globalWorkerPromise;
  }

  globalWorkerPromise = (async () => {
    const worker = new Worker(new URL("../../../workers/pyodide-worker.ts", import.meta.url), {
      type: "module",
    });

    // Set up message handler
    worker.addEventListener("message", (event: MessageEvent) => {
      const message = event.data;

      // Handle stream events
      if ("type" in message && "requestId" in message) {
        const streamEvent = message as WorkerStreamEvent;
        const subjects = streamSubjects.get(streamEvent.requestId);
        if (subjects) {
          if (streamEvent.type === "stdout" && streamEvent.data) {
            subjects.stdout.next(streamEvent.data);
          } else if (streamEvent.type === "stderr" && streamEvent.data) {
            subjects.stderr.next(streamEvent.data);
          } else if (streamEvent.type === "done") {
            subjects.stdout.complete();
            subjects.stderr.complete();
            subjects.done.next();
            subjects.done.complete();
            streamSubjects.delete(streamEvent.requestId);
          } else if (streamEvent.type === "error") {
            const error = new Error(streamEvent.error || "Unknown error");
            subjects.stdout.error(error);
            subjects.stderr.error(error);
            subjects.done.error(error);
            streamSubjects.delete(streamEvent.requestId);
          }
        }
        return;
      }

      // Handle responses
      const response = message as WorkerResponse;
      const pending = pendingRequests.get(response.id);
      if (pending) {
        pendingRequests.delete(response.id);
        if (response.success) {
          pending.resolve(response);
        } else {
          pending.reject(new Error(response.error || "Unknown error"));
        }
      }
    });

    // Initialize the worker
    const initRequest: WorkerRequest = {
      id: crypto.randomUUID(),
      type: "INIT",
      payload: {
        indexURL: pyodideUrl,
        env: {
          ANTHROPIC_API_KEY: "http-requests-are-cached",
        },
      },
    };

    await sendRequest(worker, initRequest);

    globalWorker = worker;
    globalWorkerPromise = null;
    return worker;
  })();

  return globalWorkerPromise;
}

/**
 * Send a request to the worker and wait for response
 */
function sendRequest(worker: Worker, request: WorkerRequest): Promise<WorkerResponse> {
  return new Promise((resolve, reject) => {
    pendingRequests.set(request.id, { resolve, reject });
    worker.postMessage(request);
  });
}

export interface RunnableContextType {
  /** The Pyodide instance (null when using worker) */
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
  /** Run Python code with pre-cached HTTP interactions via VCR.py cassettes */
  runPythonWithCachedHTTP: (code: string) => Promise<{
    done: () => Promise<any>;
    stdout: Observable<string>;
    stderr: Observable<string>;
  }>;
  /** Check if a given code has cached HTTP interactions as VCR.py cassettes */
  hasCachedHTTP: (code: string) => Promise<boolean>;
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
  const [worker, setWorker] = useState<Worker | null>(globalWorker);
  const [loading, setLoading] = useState(!globalWorker);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If we already have a global worker instance, use it
    if (globalWorker) {
      setWorker(globalWorker);
      return;
    }

    // If initialization is already in progress, wait for it
    if (globalWorkerPromise) {
      globalWorkerPromise
        .then((worker) => {
          setWorker(worker);
        })
        .catch((err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
        });
      return;
    }

    // Start new initialization
    async function init() {
      try {
        const workerInstance = await getOrCreateWorker(pyodideUrl);
        setWorker(workerInstance);
      } catch (err) {
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

  // Bootstrap worker after initialization
  useEffect(() => {
    if (!worker || error || !loading) {
      return;
    }

    async function bootstrap() {
      if (!worker || !loading || error) {
        return;
      }

      try {
        const bootstrapRequest: WorkerRequest = {
          id: crypto.randomUUID(),
          type: "BOOTSTRAP",
        };

        await sendRequest(worker, bootstrapRequest);
        setLoading(false);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
      }
    }
    bootstrap();
  }, [worker, error, loading]);

  const runPython = useCallback(
    (code: string) => {
      if (!worker) {
        throw new Error("Pyodide worker is not ready");
      }

      if (loading) {
        console.warn("Pyodide is still loading");
        return {
          done: () => Promise.resolve(undefined),
          stdout: new Observable<string>((observer) => observer.complete()),
          stderr: new Observable<string>((observer) => observer.complete()),
        };
      }

      const requestId = crypto.randomUUID();

      // Create subjects for this execution
      const stdout$ = new Subject<string>();
      const stderr$ = new Subject<string>();
      const done$ = new Subject<void>();

      // Track result
      let executionResult: any = undefined;

      streamSubjects.set(requestId, {
        stdout: stdout$,
        stderr: stderr$,
        done: done$,
      });

      // Send run request
      const runRequest: WorkerRequest = {
        id: requestId,
        type: "RUN_PYTHON",
        payload: { code },
      };

      // Send request and track result
      const resultPromise = sendRequest(worker, runRequest)
        .then((response) => {
          executionResult = (response.data as { result?: any })?.result;
          return executionResult;
        })
        .catch((err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          stdout$.error(error);
          stderr$.error(error);
          done$.error(error);
          streamSubjects.delete(requestId);
          throw error;
        });

      // Create done() function that returns the result promise
      // The done event is handled separately for stream completion
      const done = () => resultPromise;

      // Create observables that complete when done event fires
      const runStdout$ = stdout$.asObservable();
      const runStderr$ = stderr$.asObservable();

      return { done, stdout: runStdout$, stderr: runStderr$ };
    },
    [worker, loading]
  );

  /** Get VCR.py cassette URL for a given code */
  const getVCRCassetteUrl = (code: string) => {
    const filepath = code.match(/__filepath__ = "([^"]+)";/)?.[1] || "";
    if (!filepath) {
      return "";
    }

    // Normalize filepath: remove leading slash or "./" prefix
    const normalizedFilepath = filepath.replace(/^\.?\//, "");

    // Ensure base pathname ends with "/" so it's treated as a directory
    const basePathname = window.location.pathname.endsWith("/")
      ? window.location.pathname
      : window.location.pathname + "/";
    const cassetteURL = new URL(basePathname, window.location.origin);

    return new URL(normalizedFilepath + ".yaml", cassetteURL).toString();
  };

  /** Check if a given code snippet has cached HTTP interactions as VCR.py cassettes */
  const hasCachedHTTP = useCallback(async (code: string): Promise<boolean> => {
    const cassetteURL = getVCRCassetteUrl(code);

    if (!cassetteURL) {
      return false;
    }

    const res = await fetch(cassetteURL);
    if (!res.ok) {
      return false;
    }
    const text = await res.text();
    return text.startsWith(VCRPY_CASSETTE_INTRO);
  }, []);

  /** Run Python code with pre-cached HTTP interactions via VCR.py cassettes */
  const runPythonWithCachedHTTP = useCallback(
    async (code: string) => {
      if (!worker) {
        throw new Error("Pyodide worker is not ready");
      }

      const cassetteURL = getVCRCassetteUrl(code);

      // Load VCR.py cassette into Pyodide FS via worker
      const res = await fetch(cassetteURL);
      const cassette = await res.text();
      const baseDir = cassetteURL.substring(0, cassetteURL.lastIndexOf("/"));

      // Create directory
      const mkdirRequest: WorkerRequest = {
        id: crypto.randomUUID(),
        type: "FS_MKDIR",
        payload: { path: baseDir },
      };
      await sendRequest(worker, mkdirRequest);

      // Write file
      const writeFileRequest: WorkerRequest = {
        id: crypto.randomUUID(),
        type: "FS_WRITEFILE",
        payload: { path: cassetteURL, data: cassette },
      };
      await sendRequest(worker, writeFileRequest);

      const transformedCode = transformPythonWithVcrDecorator(code, cassetteURL);

      const { done, stdout, stderr } = runPython(transformedCode);
      return {
        done,
        stdout,
        stderr,
      };
    },
    [worker, runPython]
  );

  const value = useMemo<RunnableContextType>(
    () => ({
      pyodide: null, // Always null when using worker
      loading,
      error,
      runPython,
      runPythonWithCachedHTTP,
      hasCachedHTTP,
    }),
    [loading, error, runPython, runPythonWithCachedHTTP, hasCachedHTTP]
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
