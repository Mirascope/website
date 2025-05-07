import path from "path";
import fs from "fs";
import os from "os";
import { Browser, Page } from "puppeteer";
import { routeToFilename } from "../../src/lib/utils";
import type { SEOMetadata } from "./metadata";
import { getProjectRoot } from "../../src/lib/router-utils";

/**
 * Setup function that prepares a Puppeteer page for generating OG images
 */
async function setupOgImagePage(browser: Browser): Promise<{ page: Page; tempHtmlPath: string }> {
  // Create a new page
  const page = await browser.newPage();

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
  templateHtml = templateHtml.replace(/url\("\/([^"]+\.png)"\)/g, `url("file://${publicDir}/$1")`);
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
    await page.close();
    fs.unlinkSync(tempHtmlPath);
    throw new Error("Template is missing updateSocialCard function");
  }

  return { page, tempHtmlPath };
}

/**
 * Generate an OG image for a route using a pre-configured Puppeteer page
 */
async function generateSingleOgImage(
  page: Page,
  route: string,
  title: string,
  outputDir: string
): Promise<string> {
  // Create a safe filename
  const filename = routeToFilename(route);
  const outputPath = path.join(outputDir, `${filename}.webp`);

  // Create directory if it doesn't exist
  const directory = path.dirname(outputPath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }

  // Update the social card with the provided title
  await page.evaluate((title) => {
    window.updateSocialCard!(title);
  }, title);

  // Brief delay to ensure rendering is complete
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Take screenshot with WebP compression
  await page.screenshot({
    path: outputPath,
    type: "webp",
    quality: 80, // Adjust compression level (0-100, higher is better quality)
    clip: {
      x: 0,
      y: 0,
      width: 1200,
      height: 630,
    },
  });

  return outputPath;
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

  // Set up the page once for all images
  let page: Page | null = null;
  let tempHtmlPath: string | null = null;
  let successCount = 0;

  try {
    // Set up the page only once
    const setup = await setupOgImagePage(browser);
    page = setup.page;
    tempHtmlPath = setup.tempHtmlPath;

    // Process each route using the same page
    for (let i = 0; i < metadata.length; i++) {
      const { route, title } = metadata[i];
      if (verbose) {
        console.log(`[${i + 1}/${metadata.length}] Processing: ${route}`);
      }

      if (!title) {
        if (verbose) {
          console.log(`⚠ Skipping route with missing title: ${route}`);
        }
        continue;
      }

      // Strip the title suffix (everything after and including " |")
      let processedTitle = title;
      const pipeIndex = title.lastIndexOf(" |");
      if (pipeIndex !== -1) {
        processedTitle = title.substring(0, pipeIndex);
      }

      try {
        const imagePath = await generateSingleOgImage(page, route, processedTitle, outputDir);
        successCount++;
        if (verbose) {
          console.log(`✓ Generated image for: ${route} at ${imagePath}`);
        }
      } catch (error) {
        console.error(`✗ Failed to generate image for ${route}:`);
        console.error(error);
      }
    }
  } catch (error) {
    console.error("Error during image generation setup:", error);
  } finally {
    // Clean up resources
    if (page) {
      await page.close();
    }
    if (tempHtmlPath && fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }

  if (verbose) {
    console.log(`Completed image generation. Success: ${successCount}/${metadata.length}`);
  }
}
