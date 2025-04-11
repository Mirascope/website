import fs from "fs";
import path from "path";
import { routeToFilename } from "../../src/lib/utils";
import type { SEOMetadata } from "./metadata";

export function generateOgHtml(
  route: string,
  title: string,
  description: string | null,
  image: string | null
): string {
  const siteName = "Mirascope";
  const pageTitle = title || siteName;
  const metaDescription = description || "The AI Engineer's Developer Stack";

  // Always use our generated social cards when available
  const routeFilename = routeToFilename(route);

  // This is our preferred social card path
  const socialCardPath = `/social-cards/${routeFilename}.png`;

  // Default path to our custom generated image
  let imagePath = socialCardPath;

  // Only use a custom image if specified and not from localhost
  if (image && !image.includes("localhost")) {
    imagePath = image;
  }

  // Use relative URLs for better support across domains
  const url = route;

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <meta name="description" content="${metaDescription}">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${route}">
    <meta property="og:title" content="${pageTitle}">
    <meta property="og:description" content="${metaDescription}">
    <meta property="og:image" content="${imagePath}">
    <meta property="og:site_name" content="${siteName}">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="${route}">
    <meta name="twitter:title" content="${pageTitle}">
    <meta name="twitter:description" content="${metaDescription}">
    <meta name="twitter:image" content="${imagePath}">
    
    <!-- Redirect to the actual page -->
    <meta http-equiv="refresh" content="0;url=${url}">
  </head>
  <body>
    <p>Redirecting to <a href="${url}">${pageTitle}</a>...</p>
  </body>
  </html>`;
}

/**
 * Generate OG HTML files for all routes in the metadata record
 */
export async function generateOgHtmlFiles(record: Record<string, SEOMetadata>): Promise<void> {
  const metadata = Object.values(record);

  if (metadata.length === 0) {
    console.log("No routes to process for HTML generation");
    return;
  }

  console.log(`Generating HTML files for ${metadata.length} routes`);

  // Ensure output directory exists
  const projectRoot = process.cwd();
  const outputDir = path.join(projectRoot, "public", "og-html");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let generatedCount = 0;

  // Process each route
  for (const { route, title, description } of metadata) {
    if (!title) {
      console.log(`⚠ Skipping route with missing title: ${route}`);
      continue;
    }

    try {
      // Create filename for the HTML file
      const filename = routeToFilename(route) + ".og.html";

      // Generate HTML content
      const htmlContent = generateOgHtml(route, title, description, null);
      const outputPath = path.join(outputDir, filename);

      // Write HTML file
      fs.writeFileSync(outputPath, htmlContent);

      generatedCount++;
      console.log(`✓ Generated HTML for: ${route}`);
    } catch (error) {
      console.error(`✗ Failed to generate HTML for ${route}: ${error}`);
    }
  }

  console.log(`Completed HTML generation. Generated ${generatedCount} files.`);
}
