/**
 * Static Rendering Utilities
 *
 * Shared functionality for rendering React components to static HTML
 * and extracting metadata from the document head.
 */

import fs from "fs";
import path from "path";
import React from "react";
import { renderToString } from "react-dom/server";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../routeTree.gen";
import { environment } from "../content/environment";
import type { PageMetadata, RenderResult } from "./types";

/**
 * Static fetch implementation for server-side rendering
 * Handles file paths and content loading
 */
export async function staticFetch(url: string) {
  // Handle content paths based on the URL
  let contentPath = url;

  // For paths that start with /, add the public directory
  if (url.startsWith("/")) {
    contentPath = path.join(process.cwd(), "public", url);
  }

  // Check if the file exists
  if (!fs.existsSync(contentPath)) {
    const error = new Error(`File not found: ${contentPath}`);
    environment.onError(error);
    throw error;
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
 * Configures the environment for static rendering
 */
export function configureStaticEnvironment() {
  // @ts-ignore
  environment.fetch = staticFetch;
  environment.isDev = () => false;
  environment.isProd = () => true;
  environment.isPrerendering = true;

  return environment;
}

/**
 * Helper function to decode HTML entities
 */
export function decodeHtmlEntities(text: string): string {
  const entities: { [key: string]: string } = {
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&#x27;": "'",
    "&#39;": "'",
    "&ndash;": "–",
    "&mdash;": "—",
  };

  return text.replace(/&[^;]+;/g, (entity) => {
    return entities[entity] || entity;
  });
}

/**
 * Helper function to extract description from meta tags string
 */
export function extractDescription(metaString: string): string | null {
  const descriptionMatches =
    metaString.match(/name="description"[^>]*content="([^"]*)"/) ||
    metaString.match(/property="og:description"[^>]*content="([^"]*)"/) ||
    metaString.match(/name="twitter:description"[^>]*content="([^"]*)"/) ||
    null;

  return descriptionMatches ? decodeHtmlEntities(descriptionMatches[1]) : null;
}

/**
 * Renders a React route to a string and extracts metadata
 *
 * @param route The route to render (e.g., "/privacy")
 * @param verbose Whether to log detailed information
 * @returns The rendered HTML string and extracted metadata
 */
export async function renderRouteToString(route: string): Promise<RenderResult> {
  // Configure environment
  const env = configureStaticEnvironment();
  let loadError: Error | null = null;

  env.onError = (error: Error) => {
    loadError = error;
  };

  // Create a memory history for the specified route
  const memoryHistory = createMemoryHistory({
    initialEntries: [route],
  });

  // Create a router instance for the route
  const router = createRouter({
    routeTree,
    history: memoryHistory,
    context: {
      environment: env,
    },
  });

  // Actually load the data and the component
  await router.load();

  // Router will catch errors, but if the error was properly
  // wired to the environment handler, then we can throw it
  // and correctly signal that the component failed to load
  if (loadError) {
    throw loadError;
  }

  const originalError = console.error;
  let renderError: unknown[] = [];
  console.error = (...args: unknown[]) => {
    renderError = [...args];
  };
  // Render the app to a string
  const appHtml = renderToString(React.createElement(RouterProvider, { router }));
  console.error = originalError;

  // Check for the React client rendering fallback error in the output
  if (appHtml.includes("Switched to client rendering because the server rendering errored")) {
    // Extract both the detailed error message and stack trace
    const templateElement = appHtml.match(
      /<template data-msg="([^"]*)"(?:\s+data-stck="([^"]*)")?[^>]*>/
    );

    let errorMessage =
      "Fatal SSR error: React switched to client rendering fallback. This must be fixed before deployment.";

    if (templateElement) {
      // The error message is in capture group 1
      if (templateElement[1]) {
        const errorMsg = templateElement[1].replace(/\\n/g, "\n");
        errorMessage += `\n\nDetailed error message:\n${errorMsg}`;
      }

      // The stack trace is in capture group 2
      if (templateElement[2]) {
        const stackTrace = templateElement[2].replace(/\\n/g, "\n");
        errorMessage += `\n\nStack trace:\n${stackTrace}`;
      }
    } else {
      errorMessage += "\n\nNo detailed error information available.";
    }

    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  if (renderError.length > 0) {
    console.error("Error rendering app:", ...renderError);
    throw new Error("Error rendering: " + renderError.join(" "));
  }
  // Extract title tag from the rendered HTML
  const titleMatch = appHtml.match(/<title[^>]*>(.*?)<\/title>/);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : null;
  if (!title) {
    throw new Error("No title found in the rendered HTML");
  }

  // Extract all meta tags
  const metaTagsRegex = /<meta[^>]*>/g;
  const metaTags = appHtml.match(metaTagsRegex) || [];
  const metaTagsString = metaTags.join("\n");

  // Extract all link tags
  const linkTagsRegex = /<link[^>]*>/g;
  const linkTags = appHtml.match(linkTagsRegex) || [];
  const linkTagsString = linkTags.join("\n");

  // Extract description from meta tags
  const description = extractDescription(metaTagsString);

  // Create metadata object
  const metadata: PageMetadata = {
    title,
    description,
    meta: metaTagsString,
    link: linkTagsString,
    htmlAttributes: "",
    bodyAttributes: "",
  };

  return { html: appHtml, metadata };
}

/**
 * Creates full HTML document with rendered content and metadata
 */
export function createHtmlDocument(
  renderedApp: string,
  metadata: PageMetadata,
  templatePath: string = path.join(process.cwd(), "index.html")
): string {
  // Start with the original template
  const indexHtml = fs.readFileSync(templatePath, "utf-8");

  // First cleanup any placeholder comments in head
  let html = indexHtml.replace("<!-- Minimal head - React Helmet will manage all metadata -->", "");

  // Inject all metadata before </head>
  html = html.replace(
    "</head>",
    `<title>${metadata.title}</title>
    ${metadata.meta}
    ${metadata.link}
  </head>`
  );

  // Replace app div content with pre-rendered HTML
  html = html.replace('<div id="app"></div>', `<div id="app">${renderedApp}</div>`);

  return html;
}
