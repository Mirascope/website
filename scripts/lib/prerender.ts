import fs from "fs";
import path from "path";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../src/routeTree.gen";
import React from "react";
import { renderToString } from "react-dom/server";
import { environment } from "@/lib/content/environment";

async function staticFetch(url: string) {
  console.log(`Fetching URL: ${url}`);
  // Handle content paths based on the URL
  let contentPath = url;

  // For paths that start with /, add the public directory
  if (url.startsWith("/")) {
    contentPath = path.join(process.cwd(), "public", url);
  }

  // Check if the file exists
  if (!fs.existsSync(contentPath)) {
    console.error(`File not found: ${contentPath}`);
    throw new Error(`File not found: ${contentPath}`);
  }

  // Read the file content
  const content = fs.readFileSync(contentPath, "utf-8");

  // Determine the content type
  const isJson = contentPath.endsWith(".json");

  // Return a minimal response-like object
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    text: async () => content,
    json: async () => (isJson ? JSON.parse(content) : { content }),
  };
}

/**
 * Pre-renders a specific route to static HTML
 *
 * @param route The route to pre-render (e.g., "/privacy")
 * @param outputDir Directory to write files to (defaults to public/ssg)
 * @param verbose Whether to log detailed information
 * @returns Path to the written file
 */
export async function prerenderPage(
  route: string,
  outputDir: string = path.join(process.cwd(), "public", "ssg"),
  verbose: boolean = false
): Promise<string> {
  if (verbose) console.log(`Pre-rendering route: ${route}`);
  // @ts-ignore
  environment.fetch = staticFetch;
  environment.isDev = () => false;
  environment.isProd = () => true;

  try {
    // Create a memory history for the specified route
    const memoryHistory = createMemoryHistory({
      initialEntries: [route],
    });
    let loadError: Error | null = null;

    environment.onError = (error: Error) => {
      loadError = error;
    };

    // Create a router instance for the route
    const router = createRouter({
      routeTree,
      history: memoryHistory,
      context: {
        environment,
      },
    });

    // Actually load the data and the component
    await router.load();

    // Router will catch errors, but if the error was properly
    // wired to the environemnt handler, then we can throw it
    // and correctly signal that the component faild to load
    if (loadError) {
      throw loadError;
    }

    // Render the app to a string
    const appHtml = renderToString(React.createElement(RouterProvider, { router }));

    // Load the base HTML template
    const templatePath = path.join(process.cwd(), "index.html");
    const indexHtml = fs.readFileSync(templatePath, "utf-8");

    // Update the HTML with our pre-rendered content
    const html = indexHtml.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`);

    // Determine the output path
    let outputPath;
    if (route === "/") {
      // Root route: /index.html
      outputPath = path.join(outputDir, "index.html");
    } else {
      // Create directory for the route and place index.html inside
      const dirPath = path.join(outputDir, route.slice(1));
      fs.mkdirSync(dirPath, { recursive: true });
      outputPath = path.join(dirPath, "index.html");
    }

    // Write the file
    fs.writeFileSync(outputPath, html);

    if (verbose) console.log(`Successfully rendered ${route} to ${outputPath}`);

    return outputPath;
  } catch (error) {
    console.error(`Error pre-rendering route ${route}:`, error);
    throw error;
  }
}
