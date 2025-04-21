/**
 * Static Rendering Utilities
 *
 * Shared functionality for rendering React components to static HTML
 * and extracting metadata using React Helmet.
 */

import fs from "fs";
import path from "path";
import React from "react";
import { renderToString } from "react-dom/server";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "../../routeTree.gen";
import { environment } from "../content/environment";
import { Helmet } from "react-helmet";
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
 * Configures the environment for static rendering
 */
export function configureStaticEnvironment() {
  // @ts-ignore
  environment.fetch = staticFetch;
  environment.isDev = () => false;
  environment.isProd = () => true;

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
export async function renderRouteToString(
  route: string,
  verbose: boolean = false
): Promise<RenderResult> {
  if (verbose) console.log(`Rendering route to string: ${route}`);

  // Configure environment
  const env = configureStaticEnvironment();
  let loadError: Error | null = null;

  env.onError = (error: Error) => {
    loadError = error;
  };

  try {
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

    // Render the app to a string
    const appHtml = renderToString(React.createElement(RouterProvider, { router }));

    // Extract Helmet data after rendering
    const helmet = Helmet.renderStatic();

    // Extract relevant metadata
    const metadata: PageMetadata = {
      title: decodeHtmlEntities(
        helmet.title
          .toString()
          .replace(/<title[^>]*>(.*?)<\/title>/g, "$1")
          .trim()
      ),
      description: extractDescription(helmet.meta.toString()),
      meta: helmet.meta.toString(),
      link: helmet.link.toString(),
      htmlAttributes: helmet.htmlAttributes.toString(),
      bodyAttributes: helmet.bodyAttributes.toString(),
      helmetObject: helmet,
    };

    return { html: appHtml, metadata };
  } catch (error) {
    console.error(`Error rendering route ${route}:`, error);
    throw error;
  }
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

  // Update HTML attributes (if any)
  if (metadata.htmlAttributes) {
    html = html.replace('<html lang="en">', `<html ${metadata.htmlAttributes}>`);
  }

  // Update body attributes (if any)
  if (metadata.bodyAttributes) {
    html = html.replace("<body>", `<body ${metadata.bodyAttributes}>`);
  }

  // Inject all Helmet metadata before </head>
  html = html.replace(
    "</head>",
    `${metadata.helmetObject.title.toString()}
    ${metadata.helmetObject.meta.toString()}
    ${metadata.helmetObject.link.toString()}
    ${metadata.helmetObject.script.toString()}
  </head>`
  );

  // Replace app div content with pre-rendered HTML
  html = html.replace('<div id="app"></div>', `<div id="app">${renderedApp}</div>`);

  return html;
}
