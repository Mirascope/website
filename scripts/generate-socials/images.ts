import path from "path";
import fs from "fs";
import os from "os";
import { Browser } from "puppeteer";
import { routeToFilename } from "../../src/lib/utils";
import type { SEOMetadata } from "./metadata";
import { getProjectRoot } from "../../src/lib/router-utils";

/**
 * Generate an OG image for a route using Puppeteer
 */
export async function generateOgImage(
  browser: Browser,
  route: string,
  title: string,
  description: string | null,
  outputDir: string
): Promise<string> {
  // Create a safe filename
  const filename = routeToFilename(route);
  const outputPath = path.join(outputDir, `${filename}.png`);

  // Create directory if it doesn't exist
  const directory = path.dirname(outputPath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  // Create a new page
  const page = await browser.newPage();

  try {
    // Set viewport to OG image dimensions (1200×630)
    await page.setViewport({
      width: 1200,
      height: 630,
      deviceScaleFactor: 1,
    });

    // Load the template directly
    const projectRoot = getProjectRoot();
    const templatePath = path.join(projectRoot, "public", "dev", "social-card.html");

    // Read the template file
    let templateHtml = fs.readFileSync(templatePath, "utf-8");

    // Replace relative paths with absolute file paths
    const publicDir = path.join(projectRoot, "public");

    // Replace asset paths with absolute file:// URLs
    templateHtml = templateHtml.replace(
      /url\("\/fonts\/([^"]+)"\)/g,
      `url("file://${publicDir}/fonts/$1")`
    );
    templateHtml = templateHtml.replace(
      /url\("\/([^"]+\.png)"\)/g,
      `url("file://${publicDir}/$1")`
    );
    templateHtml = templateHtml.replace(/src="\/([^"]+)"/g, `src="file://${publicDir}/$1"`);

    // Write a temporary file with the modified HTML
    const tempDir = os.tmpdir();
    const tempHtmlPath = path.join(tempDir, `social-card-${Date.now()}.html`);
    fs.writeFileSync(tempHtmlPath, templateHtml);

    // Navigate to the modified template file
    await page.goto(`file://${tempHtmlPath}`, { waitUntil: "networkidle0", timeout: 5000 });

    // Check if updateSocialCard function exists
    const hasUpdateFunction = await page.evaluate(() => {
      return typeof window.updateSocialCard === "function";
    });

    if (!hasUpdateFunction) {
      throw new Error("Template is missing updateSocialCard function");
    }

    // Update the social card with the provided title and description
    await page.evaluate(
      (title, description) => {
        window.updateSocialCard!(title, description || "");
      },
      title,
      description
    );

    // Brief delay to ensure rendering is complete
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Take screenshot
    await page.screenshot({
      path: outputPath,
      type: "png",
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 630,
      },
    });

    // Clean up the temp file
    fs.unlinkSync(tempHtmlPath);

    return outputPath;
  } finally {
    // Close the page
    await page.close();
  }
}

/**
 * Generate OG images for multiple routes
 *
 * @param browser - Puppeteer browser instance
 * @param metadata - Metadata items to generate images for
 * @param verbose - Whether to log output
 */
export async function generateOgImages(
  browser: Browser,
  metadata: SEOMetadata[],
  verbose = true
): Promise<void> {
  if (metadata.length === 0) {
    if (verbose) {
      console.log("No routes to process for image generation");
    }
    return;
  }

  // Ensure output directory exists
  const projectRoot = getProjectRoot();
  const outputDir = path.join(projectRoot, "public", "social-cards");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  if (verbose) {
    console.log(`Generating images for ${metadata.length} routes`);
  }

  let successCount = 0;

  // Process each route
  for (let i = 0; i < metadata.length; i++) {
    const { route, title, description } = metadata[i];
    if (verbose) {
      console.log(`[${i + 1}/${metadata.length}] Processing: ${route}`);
    }

    if (!title) {
      if (verbose) {
        console.log(`⚠ Skipping route with missing title: ${route}`);
      }
      continue;
    }

    try {
      const imagePath = await generateOgImage(browser, route, title, description, outputDir);
      successCount++;
      if (verbose) {
        console.log(`✓ Generated image for: ${route} at ${imagePath}`);
      }
    } catch (error) {
      console.error(`✗ Failed to generate image for ${route}:`);
      console.error(error);
    }
  }

  if (verbose) {
    console.log(`Completed image generation. Success: ${successCount}/${metadata.length}`);
  }
}
