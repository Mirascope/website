#!/usr/bin/env bun
/**
 * Generate static HTML files with proper OG meta tags for each route
 *
 * This script:
 * 1. Reads the SEO metadata from the seo-metadata.json file
 * 2. Creates static HTML files for each route with proper meta tags
 * 3. Generates a _redirects file for Cloudflare Pages
 */

import fs from "fs";
import path from "path";
import { getProjectRoot } from "../src/lib/router-utils";

// ANSI color codes for better output
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";

// Interface for SEO metadata
interface SEOMetadata {
  route: string;
  title: string;
  description: string | null;
  image: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  lastUpdated: string;
}

// Print a section header
function printHeader(title: string, color: string = BLUE): void {
  console.log("\n" + color + "=".repeat(50) + RESET);
  console.log(color + ` ${title} ` + RESET);
  console.log(color + "=".repeat(50) + RESET);
}

/**
 * Function to convert a route path to a filename
 */
function routeToFilename(route: string): string {
  // Handle the root route
  if (route === "/") {
    return "index.og.html";
  }

  // Convert paths like /blog/post-1 to blog-post-1.og.html
  return route.substring(1).replace(/\//g, "-") + ".og.html";
}

/**
 * Generate HTML with meta tags for a route
 */
function generateOgHtml(
  route: string,
  title: string,
  description: string | null,
  image: string | null,
  siteUrl: string = "https://mirascope.com"
): string {
  const siteName = "Mirascope";
  const pageTitle = title || siteName;
  const metaDescription = description || "The AI Engineer's Developer Stack";

  // Always use our generated social cards when available
  const routeFilename = route === "/" ? "index" : route.replace(/^\//, "").replace(/\//g, "-");

  // This is our preferred social card path
  const socialCardPath = `/social-cards/${routeFilename}.png`;

  // Default path to our custom generated image
  let imagePath = socialCardPath;

  // Only use a custom image if specified and not from localhost
  if (image && !image.includes("localhost")) {
    imagePath = image;
  }

  // Create the URL for this route
  const url = route === "/" ? siteUrl : `${siteUrl}${route}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
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
 * Main function
 */
async function main() {
  printHeader("OG HTML Generation", CYAN);

  try {
    const projectRoot = getProjectRoot();

    // Check if metadata file exists
    const metadataPath = path.join(projectRoot, "public", "seo-metadata.json");
    if (!fs.existsSync(metadataPath)) {
      console.error(`${RED}Metadata file not found: ${metadataPath}${RESET}`);
      console.error(`${YELLOW}Run extract-seo-metadata.ts first to generate the metadata${RESET}`);
      process.exit(1);
    }

    // Read SEO metadata
    const rawMetadata = fs.readFileSync(metadataPath, "utf-8");
    const metadata: SEOMetadata[] = JSON.parse(rawMetadata);
    console.log(`${GREEN}Found metadata for ${metadata.length} routes${RESET}`);

    // Create output directory for OG HTML files
    const outputDir = path.join(projectRoot, "public", "og-html");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate _redirects file content for Cloudflare Pages
    let redirectsContent = "# Redirects for social media crawlers\n";
    redirectsContent += "# Format: [URL] [Destination] [Status]\n\n";

    // Counter for generated files
    let generatedCount = 0;

    // Process each route
    for (const item of metadata) {
      const route = item.route;
      const title = item.ogTitle || item.title;
      const description = item.ogDescription || item.description;
      const image = item.ogImage || item.image;

      if (!title) {
        console.log(`${YELLOW}⚠ Skipping route with missing title: ${route}${RESET}`);
        continue;
      }

      try {
        // Generate HTML file
        const filename = routeToFilename(route);
        const htmlContent = generateOgHtml(route, title, description, image);
        const outputPath = path.join(outputDir, filename);

        // Write HTML file
        fs.writeFileSync(outputPath, htmlContent);
        console.log(`${GREEN}✓${RESET} Generated: ${path.relative(projectRoot, outputPath)}`);

        // Add to redirects file - use different user agent patterns for different crawlers
        redirectsContent += `${route} /og-html/${filename} 200! User-agent=facebookexternalhit\n`;
        redirectsContent += `${route} /og-html/${filename} 200! User-agent=Twitterbot\n`;
        redirectsContent += `${route} /og-html/${filename} 200! User-agent=Slackbot\n`;
        redirectsContent += `${route} /og-html/${filename} 200! User-agent=LinkedInBot\n`;
        redirectsContent += `${route} /og-html/${filename} 200! User-agent=TelegramBot\n`;
        redirectsContent += `${route} /og-html/${filename} 200! User-agent=Discordbot\n`;

        generatedCount++;
      } catch (error) {
        console.error(`${RED}✗${RESET} Failed to generate OG HTML for ${route}: ${error}`);
      }
    }

    // Write _redirects file
    const redirectsPath = path.join(projectRoot, "public", "_redirects");
    fs.writeFileSync(redirectsPath, redirectsContent);
    console.log(`${GREEN}✓${RESET} Generated: ${path.relative(projectRoot, redirectsPath)}`);

    printHeader("OG HTML Generation Complete", GREEN);
    console.log(`${GREEN}Successfully generated ${generatedCount} OG HTML files${RESET}`);
    console.log(`${GREEN}Generated _redirects file for Cloudflare Pages${RESET}`);
  } catch (error) {
    console.error(`\n${RED}Error generating OG HTML: ${error}${RESET}`);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
