/**
 * Type definitions for Pyodide Web Worker message protocol
 */

export type WorkerMessageType = "INIT" | "BOOTSTRAP" | "RUN_PYTHON" | "FS_MKDIR" | "FS_WRITEFILE";

export type WorkerStreamType = "stdout" | "stderr" | "done" | "error";

export interface BaseWorkerRequest {
  id: string;
}

export interface InitRequest extends BaseWorkerRequest {
  type: "INIT";
  payload: {
    indexURL: string;
    env?: Record<string, string>;
  };
}

export interface BootstrapRequest extends BaseWorkerRequest {
  type: "BOOTSTRAP";
}

export interface RunPythonRequest extends BaseWorkerRequest {
  type: "RUN_PYTHON";
  payload: {
    code: string;
  };
}

export interface FSMkdirRequest extends BaseWorkerRequest {
  type: "FS_MKDIR";
  payload: {
    path: string;
  };
}

export interface FSWriteFileRequest extends BaseWorkerRequest {
  type: "FS_WRITEFILE";
  payload: {
    path: string;
    data: string;
  };
}

export type WorkerRequest =
  | InitRequest
  | BootstrapRequest
  | RunPythonRequest
  | FSMkdirRequest
  | FSWriteFileRequest;

export interface WorkerStreamEvent {
  type: WorkerStreamType;
  requestId: string;
  data?: string;
  error?: string;
}

export interface WorkerResponse {
  id: string;
  success: boolean;
  error?: string;
  data?: unknown;
}
