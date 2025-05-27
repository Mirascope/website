import fs from "fs";
import path from "path";
import { renderRouteToString, createHtmlDocument } from "../../src/lib/rendering";

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
  outputDir: string,
  verbose: boolean = false
): Promise<string> {
  if (verbose) console.log(`Pre-rendering route: ${route}`);

  // Use the shared rendering utility to render the route
  const { html: appHtml, metadata } = await renderRouteToString(route);

  // Create the full HTML document
  const html = createHtmlDocument(appHtml, metadata);

  // Determine the output path
  let outputPath;
  if (route === "/") {
    // Root route: /index.html
    outputPath = path.join(outputDir, "index.html");
  } else {
    // Create a file named after the route path (without trailing slash)
    // e.g., /docs/mirascope -> docs/mirascope.html
    const routePath = route.slice(1); // Remove leading slash
    const parentDir = path.dirname(routePath);

    // Ensure parent directory exists
    if (parentDir !== ".") {
      const fullParentDir = path.join(outputDir, parentDir);
      fs.mkdirSync(fullParentDir, { recursive: true });
    }

    outputPath = path.join(outputDir, `${routePath}.html`);
  }

  // Write the file
  fs.writeFileSync(outputPath, html);

  if (verbose) console.log(`Successfully rendered ${route} to ${outputPath}`);

  return outputPath;
}
