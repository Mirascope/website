import fs from "fs";
import path from "path";

/**
 * Creates a Node.js based fetch implementation for loading content from the file system
 * to be used in server-side environments.
 *
 * @param basePath - Base path for resolving files
 * @returns A fetch-compatible function for loading content
 */
export function createNodeFetch(basePath = process.cwd()): any {
  // Create the basic fetch implementation
  const fetchImplementation = async (url: string) => {
    try {
      // Convert URL to a file path
      let filePath = "";
      console.error(`Node fetch: URL requested: ${url}`);
      console.error(`Node fetch: Base path: ${basePath}`);

      // Handle URLs without a leading slash
      const normalizedUrl = url.startsWith("/") ? url : `/${url}`;

      // Handle URLs to static content
      if (normalizedUrl.includes("/static/")) {
        filePath = path.join(basePath, "public", normalizedUrl);
      } else {
        // Handle URLs to source content
        filePath = path.join(basePath, normalizedUrl);
      }

      // Check if the file exists
      if (!fs.existsSync(filePath)) {
        console.error(`Node fetch: File not found at ${filePath}`);
        return new Response("", {
          status: 404,
          statusText: "Not Found",
        });
      }

      // Read the file
      const content = fs.readFileSync(filePath, "utf-8");

      // Return a Response object that mimics the fetch API
      return new Response(content, {
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": filePath.endsWith(".json") ? "application/json" : "text/plain",
        },
      });
    } catch (error) {
      console.error("Error in Node fetch:", error);
      return new Response("", {
        status: 500,
        statusText: String(error),
      });
    }
  };

  // Return the fetch implementation directly
  return fetchImplementation;
}
