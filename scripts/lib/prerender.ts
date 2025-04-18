import fs from "fs";
import path from "path";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../src/routeTree.gen";
import React from "react";
import { renderToString } from "react-dom/server";
import { environment } from "@/lib/content/environment";
import { Helmet } from "react-helmet";

async function staticFetch(url: string) {
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

    // Extract Helmet data after rendering
    const helmet = Helmet.renderStatic();

    // Start with the original template but inject Helmet data
    const templatePath = path.join(process.cwd(), "index.html");
    const indexHtml = fs.readFileSync(templatePath, "utf-8");

    // First cleanup any placeholder comments in head
    let html = indexHtml.replace(
      "<!-- Minimal head - React Helmet will manage all metadata -->",
      ""
    );

    // Update HTML attributes (if any)
    const htmlAttrs = helmet.htmlAttributes.toString();
    if (htmlAttrs) {
      html = html.replace('<html lang="en">', `<html ${htmlAttrs}>`);
    }

    // Update body attributes (if any)
    const bodyAttrs = helmet.bodyAttributes.toString();
    if (bodyAttrs) {
      html = html.replace("<body>", `<body ${bodyAttrs}>`);
    }

    // Inject all Helmet metadata before </head>
    html = html.replace(
      "</head>",
      `${helmet.title.toString()}
    ${helmet.meta.toString()}
    ${helmet.link.toString()}
    ${helmet.script.toString()}
  </head>`
    );

    // Replace app div content with pre-rendered HTML
    html = html.replace('<div id="app"></div>', `<div id="app">${appHtml}</div>`);

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
