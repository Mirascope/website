/**
 * Development Server and Browser Management
 *
 * This module provides utilities for managing development servers and Puppeteer browsers,
 * with context-manager-like functions for clean resource handling.
 */

import { spawn, ChildProcess } from "child_process";
import { coloredLog, colorize } from "../lib/terminal";
import { Browser, launch } from "puppeteer";

// Port range for development server
const BASE_PORT = 3939;
const MAX_PORT_ATTEMPTS = 10;

/**
 * Check if a port is already in use
 *
 * @param port - The port to check
 * @returns True if the port is already in use
 */
async function isPortInUse(port: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);

    // Try to connect to the port
    await fetch(`http://localhost:${port}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // If we get a response, something is already running on this port
    return true;
  } catch (e) {
    // If there's an error, the port is probably not in use
    return false;
  }
}

/**
 * Find an available port to use
 *
 * @param startPort - The starting port number
 * @param maxAttempts - Maximum number of port numbers to try
 * @param verbose - Whether to print verbose output
 * @returns An available port number or throws if none available
 */
async function findAvailablePort(
  startPort: number,
  maxAttempts: number = 10,
  verbose: boolean = false
): Promise<number> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const port = startPort + attempt;

    if (await isPortInUse(port)) {
      if (verbose) {
        coloredLog(`Port ${port} is already in use, trying next port...`, "yellow");
      }
      continue;
    }

    if (verbose && attempt > 0) {
      coloredLog(`Using available port: ${port}`, "green");
    }

    return port;
  }

  throw new Error(
    `Failed to find an available port after ${maxAttempts} attempts starting from ${startPort}`
  );
}

/**
 * Wait for the development server to be ready
 *
 * @param port - The port to check
 * @param maxWaitTimeMs - Maximum time to wait in milliseconds
 * @returns Whether the server is ready
 */
async function waitForServer(port: number, maxWaitTimeMs: number = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitTimeMs) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      const response = await fetch(`http://localhost:${port}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        return true;
      }
    } catch (e) {
      // Retry
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return false;
}

/**
 * Start the development server
 *
 * @param port - Server port
 * @param verbose - Whether to print verbose output
 * @returns The server process and the port it's running on
 */
async function startDevServer(
  port: number,
  verbose = false
): Promise<{ server: ChildProcess; port: number }> {
  // Try to find an available port first
  let availablePort: number;
  try {
    availablePort = await findAvailablePort(port, MAX_PORT_ATTEMPTS, verbose);
  } catch (error) {
    throw new Error(`Failed to find an available port: ${error}`);
  }

  if (verbose) {
    coloredLog(`Starting development server on port ${availablePort}...`, "cyan");
  }

  const devServer = spawn("bun", ["run", "dev", "--port", availablePort.toString()], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  // Only log stdout if verbose is true
  devServer.stdout.on("data", (data) => {
    if (verbose) {
      console.log(`${colorize("[Dev Server]", "yellow")} ${data.toString().trim()}`);
    }
  });

  // Log stderr only if verbose or contains error
  devServer.stderr.on("data", (data) => {
    const errorText = data.toString().trim();

    // Skip the SIGTERM message that happens during normal shutdown
    if (errorText.includes("terminated by signal SIGTERM")) {
      return;
    }

    // Always log actual errors, but filter routine messages if not verbose
    if (verbose || errorText.includes("Error") || errorText.includes("error")) {
      console.error(`${colorize("[Dev Server Error]", "red")} ${errorText}`);
    }
  });

  // Add error handler to catch unhandled errors
  devServer.on("error", (error) => {
    console.error(`${colorize("[Dev Server Error]", "red")} ${error}`);
  });

  // Add exit handler to log if the server exits unexpectedly
  devServer.on("exit", (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`${colorize("[Dev Server Exit]", "red")} with code ${code}`);
    } else if (signal) {
      if (verbose) {
        console.log(`${colorize("[Dev Server]", "yellow")} terminated by signal ${signal}`);
      }
    }
  });

  const serverReady = await waitForServer(availablePort);
  if (!serverReady) {
    throw new Error(`Development server failed to start within timeout on port ${availablePort}`);
  }

  if (verbose) {
    coloredLog(`Development server started on port ${availablePort}`, "green");
  }

  return { server: devServer, port: availablePort };
}

/**
 * Stop the development server
 *
 * @param server - The server process
 * @param port - The port the server is running on
 * @param verbose - Whether to print verbose output
 */
async function stopDevServer(server: ChildProcess, port: number, verbose = false): Promise<void> {
  if (verbose) {
    coloredLog(`Stopping development server on port ${port}...`, "cyan");
  }

  try {
    if (server.pid) {
      process.kill(-server.pid, "SIGTERM");

      // Give it a moment to shut down
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if it's still running
      if (await isPortInUse(port)) {
        console.warn(
          `${colorize(`Warning: Port ${port} still in use after server termination.`, "yellow")}`
        );
        console.warn(
          `${colorize(`You may need to manually terminate the process listening on port ${port}.`, "yellow")}`
        );
      } else if (verbose) {
        coloredLog(`Development server stopped on port ${port}`, "green");
      }
    } else {
      console.error(`${colorize("Server has no PID", "red")}`);
    }
  } catch (error) {
    console.error(`${colorize("Failed to stop server:", "red")} ${error}`);
  }
}

/**
 * Execute a function with a development server, ensuring proper cleanup
 * Similar to Python's "with" statement for context management
 *
 * @param fn - Function to execute with the server (receives port number)
 * @param options - Options for the server
 * @returns The result of the function
 */
export async function withDevServer<T>(
  fn: (port: number) => Promise<T>,
  options: { port?: number; verbose?: boolean } = {}
): Promise<T> {
  const { port = BASE_PORT, verbose = false } = options;

  // Launch dev server and get the port it's actually running on
  const { server, port: actualPort } = await startDevServer(port, verbose);

  try {
    // Pass the actual port to the function
    return await fn(actualPort);
  } finally {
    // Use the actual port when stopping the server
    await stopDevServer(server, actualPort, verbose);
  }
}

/**
 * Execute a function with a Puppeteer browser, ensuring proper cleanup
 * Similar to Python's "with" statement for context management
 *
 * @param fn - Function to execute with the browser
 * @param options - Options for the browser
 * @returns The result of the function
 */
export async function withBrowser<T>(
  fn: (browser: Browser) => Promise<T>,
  options: { headless?: boolean; verbose?: boolean } = {}
): Promise<T> {
  const { headless = true, verbose = false } = options;

  if (verbose) {
    coloredLog("Launching browser...", "cyan");
  }

  const browser = await launch({ headless });

  try {
    if (verbose) {
      coloredLog("Browser launched", "green");
    }
    return await fn(browser);
  } finally {
    if (verbose) {
      coloredLog("Closing browser...", "cyan");
    }
    await browser.close();
    if (verbose) {
      coloredLog("Browser closed", "green");
    }
  }
}

/**
 * Execute a function with both a dev server and browser, ensuring proper cleanup
 *
 * @param fn - Function to execute with server port and browser
 * @param options - Options for the server and browser
 * @returns The result of the function
 */
export async function withDevEnvironment<T>(
  fn: (port: number, browser: Browser) => Promise<T>,
  options: { port?: number; headless?: boolean; verbose?: boolean } = {}
): Promise<T> {
  return withDevServer((port) => withBrowser((browser) => fn(port, browser), options), options);
}
