/**
 * Web Worker for running Pyodide in a separate thread
 */

import { loadPyodide, type PyodideInterface } from "pyodide";
import type { WorkerRequest, WorkerResponse, WorkerStreamEvent } from "./pyodide-worker-types";

let pyodide: PyodideInterface | null = null;
let isInitialized = false;
let isBootstrapped = false;

// Track active executions for stdout/stderr streaming
const activeExecutions = new Set<string>();

/**
 * Send a stream event (stdout/stderr) to the main thread
 */
function sendStreamEvent(requestId: string, type: "stdout" | "stderr", data: string): void {
  const event: WorkerStreamEvent = {
    type,
    requestId,
    data,
  };
  self.postMessage(event);
}

/**
 * Send a response to the main thread
 */
function sendResponse(response: WorkerResponse): void {
  self.postMessage(response);
}

/**
 * Send an error response
 */
function sendError(id: string, error: string): void {
  sendResponse({
    id,
    success: false,
    error,
  });
}

/**
 * Send a success response
 */
function sendSuccess(id: string, data?: unknown): void {
  sendResponse({
    id,
    success: true,
    data,
  });
}

/**
 * Initialize Pyodide
 */
async function handleInit(request: Extract<WorkerRequest, { type: "INIT" }>) {
  if (isInitialized && pyodide) {
    sendSuccess(request.id, { alreadyInitialized: true });
    return;
  }

  try {
    const { indexURL, env } = request.payload;
    pyodide = await loadPyodide({
      indexURL,
      env: env || {},
    });

    // Set up stdout/stderr handlers
    pyodide.setStdout({
      write: (buffer: Uint8Array) => {
        const decoder = new TextDecoder("utf-8");
        const text = decoder.decode(buffer, { stream: true });
        // Send to all active executions
        activeExecutions.forEach((requestId) => {
          sendStreamEvent(requestId, "stdout", text);
        });
        return buffer.length;
      },
    });

    pyodide.setStderr({
      write: (buffer: Uint8Array) => {
        const decoder = new TextDecoder("utf-8");
        const text = decoder.decode(buffer, { stream: true });
        // Send to all active executions
        activeExecutions.forEach((requestId) => {
          sendStreamEvent(requestId, "stderr", text);
        });
        return buffer.length;
      },
    });

    isInitialized = true;
    sendSuccess(request.id, { initialized: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendError(request.id, `Failed to initialize Pyodide: ${errorMessage}`);
  }
}

/**
 * Bootstrap Pyodide with packages and pre-imports
 */
async function handleBootstrap(request: Extract<WorkerRequest, { type: "BOOTSTRAP" }>) {
  if (!pyodide || !isInitialized) {
    sendError(request.id, "Pyodide not initialized");
    return;
  }

  if (isBootstrapped) {
    sendSuccess(request.id, { alreadyBootstrapped: true });
    return;
  }

  try {
    await pyodide.loadPackage("micropip");

    // Install dependencies
    const micropip = pyodide.pyimport("micropip");
    await micropip.install("vcrpy==7.0.0");
    await micropip.install("mirascope[anthropic]==2.0.0a2");

    // Pre-importing makes code blocks run faster
    await pyodide.runPythonAsync(`
      import vcr
      from mirascope import llm
    `);

    console.log("Pyodide bootstrapped successfully");
    isBootstrapped = true;
    sendSuccess(request.id, { bootstrapped: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendError(request.id, `Failed to bootstrap Pyodide: ${errorMessage}`);
  }
}

/**
 * Run Python code
 */
async function handleRunPython(request: Extract<WorkerRequest, { type: "RUN_PYTHON" }>) {
  if (!pyodide || !isInitialized) {
    sendError(request.id, "Pyodide not initialized");
    return;
  }

  if (!isBootstrapped) {
    sendError(request.id, "Pyodide not bootstrapped");
    return;
  }

  try {
    activeExecutions.add(request.id);
    const result = await pyodide.runPythonAsync(request.payload.code);

    // Send done event
    const doneEvent: WorkerStreamEvent = {
      type: "done",
      requestId: request.id,
    };
    self.postMessage(doneEvent);

    activeExecutions.delete(request.id);
    sendSuccess(request.id, { result });
  } catch (error) {
    activeExecutions.delete(request.id);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorEvent: WorkerStreamEvent = {
      type: "error",
      requestId: request.id,
      error: errorMessage,
    };
    self.postMessage(errorEvent);
    sendError(request.id, errorMessage);
  }
}

/**
 * Create directory in Pyodide FS
 */
async function handleFSMkdir(request: Extract<WorkerRequest, { type: "FS_MKDIR" }>) {
  if (!pyodide || !isInitialized) {
    sendError(request.id, "Pyodide not initialized");
    return;
  }

  try {
    await pyodide.FS.mkdirTree(request.payload.path);
    sendSuccess(request.id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendError(request.id, `Failed to create directory: ${errorMessage}`);
  }
}

/**
 * Write file to Pyodide FS
 */
async function handleFSWriteFile(request: Extract<WorkerRequest, { type: "FS_WRITEFILE" }>) {
  if (!pyodide || !isInitialized) {
    sendError(request.id, "Pyodide not initialized");
    return;
  }

  try {
    await pyodide.FS.writeFile(request.payload.path, request.payload.data);
    sendSuccess(request.id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendError(request.id, `Failed to write file: ${errorMessage}`);
  }
}

/**
 * Main message handler
 */
self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  switch (request.type) {
    case "INIT":
      await handleInit(request);
      break;
    case "BOOTSTRAP":
      await handleBootstrap(request);
      break;
    case "RUN_PYTHON":
      await handleRunPython(request);
      break;
    case "FS_MKDIR":
      await handleFSMkdir(request);
      break;
    case "FS_WRITEFILE":
      await handleFSWriteFile(request);
      break;
  }
});
