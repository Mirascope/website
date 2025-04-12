/**
 * Development Server and Browser Management
 *
 * This module provides utilities for managing development servers and Puppeteer browsers,
 * with context-manager-like functions for clean resource handling.
 */

import { spawn, ChildProcess } from "child_process";
import { coloredLog, colorize } from "../lib/terminal";
import { Browser, launch } from "puppeteer";

// Port for development server
const DEFAULT_PORT = 3939;

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
 * @returns The server process
 */
async function startDevServer(port: number, verbose = false): Promise<ChildProcess> {
  if (verbose) {
    coloredLog(`Starting development server on port ${port}...`, "cyan");
  }

  const devServer = spawn("bun", ["run", "dev", "--port", port.toString()], {
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

  const serverReady = await waitForServer(port);
  if (!serverReady) {
    throw new Error(`Development server failed to start within timeout`);
  }

  if (verbose) {
    coloredLog("Development server started", "green");
  }

  return devServer;
}

/**
 * Stop the development server
 *
 * @param server - The server process
 * @param verbose - Whether to print verbose output
 */
function stopDevServer(server: ChildProcess, verbose = false): void {
  if (verbose) {
    coloredLog("Stopping development server...", "cyan");
  }

  try {
    if (server.pid) {
      process.kill(-server.pid, "SIGTERM");

      if (verbose) {
        coloredLog("Development server stopped", "green");
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
  const { port = DEFAULT_PORT, verbose = false } = options;
  const server = await startDevServer(port, verbose);

  try {
    return await fn(port);
  } finally {
    stopDevServer(server, verbose);
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
