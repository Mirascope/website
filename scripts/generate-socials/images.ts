import path from "path";
import fs from "fs";
import { Browser } from "puppeteer";
import { routeToFilename } from "../../src/lib/utils";
import type { SEOMetadata } from "./metadata";
import { getProjectRoot } from "../../src/lib/router-utils";
// Interface for mime types
interface MimeTypeMap {
  [key: string]: string;
}

// Get MIME type based on file extension
function getFileMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: MimeTypeMap = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  };

  return mimeTypes[ext] || "application/octet-stream";
}

/**
 * Generate the HTML template for an OG image
 */
function generateOgTemplate(title: string, description: string | null): string {
  // Load assets as base64 to embed directly in HTML
  function loadAssetAsBase64(relativePath: string): string {
    const assetPath = path.join(getProjectRoot(), "public", relativePath);
    if (!fs.existsSync(assetPath)) {
      console.warn(`Warning: Asset not found at ${assetPath}`);
      return "";
    }

    const fileData = fs.readFileSync(assetPath);
    const base64Data = fileData.toString("base64");
    const mime = getFileMimeType(relativePath);
    return `data:${mime};base64,${base64Data}`;
  }

  // Calculate title font size based on length
  function calculateTitleFontSize(titleLength: number): string {
    if (titleLength > 70) return "48px"; // Very long titles
    if (titleLength > 50) return "56px"; // Long titles
    if (titleLength > 30) return "64px"; // Medium titles
    return "72px"; // Short titles
  }
  const backgroundImage = loadAssetAsBase64("../../public/dark-mode-watercolor-background.png");
  const logoImage = loadAssetAsBase64("../../public/frog-logo.png");
  const fontData = loadAssetAsBase64("../../public/fonts/Williams-Handwriting-Regular-v1.ttf");

  // Calculate title font size based on length
  const titleFontSize = calculateTitleFontSize(title.length);
  const lineHeight = title.length > 40 ? "1.3" : "1.2";
  const descriptionFontSize = title.length > 50 ? "36px" : "42px";

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Social Card</title>
    <style>
      @font-face {
        font-family: "Williams Handwriting";
        src: url("${fontData}") format("truetype");
        font-weight: normal;
        font-style: normal;
      }
      
      body, html {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        font-family: sans-serif;
      }
      
      .card-container {
        width: 1200px;
        height: 630px;
        display: flex;
        flex-direction: column;
        align-items: center;
        background-image: url("${backgroundImage}");
        background-size: cover;
        background-position: center bottom;
        position: relative;
        overflow: hidden;
      }
      
      .torn-paper-effect {
        clip-path: polygon(
          0% 4%, 10% 0%, 20% 2%, 30% 0%, 40% 3%, 50% 0%, 60% 2%, 70% 0%, 
          80% 3%, 90% 0%, 100% 4%, 99% 20%, 100% 35%, 98% 50%, 100% 65%, 
          99% 80%, 100% 96%, 90% 100%, 80% 97%, 70% 100%, 60% 98%, 50% 100%, 
          40% 97%, 30% 100%, 20% 98%, 10% 100%, 0% 96%, 1% 80%, 0% 65%, 
          2% 50%, 0% 35%, 1% 20%
        );
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
      
      .logo-banner {
        position: absolute;
        top: 20px;
        right: 30px;
        z-index: 10;
      }
      
      .logo-inner {
        position: relative;
        padding: 10px 15px;
      }
      
      .logo-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: white;
      }
      
      .logo-content {
        display: flex;
        align-items: center;
        position: relative;
        z-index: 1;
      }
      
      .logo-img {
        width: 40px;
        height: 40px;
        margin-right: 10px;
      }
      
      .logo-text {
        font-family: "Williams Handwriting", cursive;
        font-size: 42px;
        color: #6366f1;
      }
      
      .content {
        position: absolute;
        top: 53%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        max-width: 950px;
        text-align: center;
        padding: 0 20px;
      }
      
      .title {
        font-family: "Williams Handwriting", cursive;
        color: #ffffff;
        margin: 0 0 20px 0;
        word-break: break-word;
        text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 3px rgba(0, 0, 0, 0.5), 
                     1px -1px 3px rgba(0, 0, 0, 0.5), -1px 1px 3px rgba(0, 0, 0, 0.5);
      }
      
      .description {
        font-family: "Williams Handwriting", cursive;
        color: #ffffff;
        margin: 0;
        line-height: 1.4;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5), -1px -1px 3px rgba(0, 0, 0, 0.5), 
                     1px -1px 3px rgba(0, 0, 0, 0.5), -1px 1px 3px rgba(0, 0, 0, 0.5);
      }
    </style>
  </head>
  <body>
    <div class="card-container">
      <div class="logo-banner">
        <div class="logo-inner">
          <div class="logo-bg torn-paper-effect"></div>
          <div class="logo-content">
            <img src="${logoImage}" alt="Mirascope Logo" class="logo-img">
            <span class="logo-text">Mirascope</span>
          </div>
        </div>
      </div>
      
      <div class="content">
        <h1 class="title" style="font-size: ${titleFontSize}; line-height: ${lineHeight};">
          ${title}
        </h1>
        <p class="description" style="font-size: ${descriptionFontSize};">
          ${description}
        </p>
      </div>
    </div>
  </body>
  </html>
    `;
}

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

  // Set viewport to OG image dimensions (1200×630)
  await page.setViewport({
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
  });

  // Generate HTML and set content
  const htmlContent = generateOgTemplate(title, description);
  await page.setContent(htmlContent, {
    waitUntil: "networkidle0",
    timeout: 10000,
  });

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

  // Close the page
  await page.close();

  return outputPath;
}

/**
 * Generate OG images for multiple routes
 */
export async function generateOgImages(metadata: SEOMetadata[]): Promise<void> {
  if (metadata.length === 0) {
    console.log("No routes to process for image generation");
    return;
  }

  console.log(`Generating images for ${metadata.length} routes`);

  // Ensure output directory exists
  const projectRoot = process.cwd();
  const outputDir = path.join(projectRoot, "public", "social-cards");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Launch Puppeteer
  const puppeteer = await import("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    let successCount = 0;

    // Process each route
    for (let i = 0; i < metadata.length; i++) {
      const { route, title, description } = metadata[i];
      console.log(`[${i + 1}/${metadata.length}] Processing: ${route}`);

      if (!title) {
        console.log(`⚠ Skipping route with missing title: ${route}`);
        continue;
      }

      try {
        await generateOgImage(browser, route, title, description, outputDir);
        successCount++;
        console.log(`✓ Generated image for: ${route}`);
      } catch (error) {
        console.error(`✗ Failed to generate image for ${route}: ${error}`);
      }
    }

    console.log(`Completed image generation. Success: ${successCount}/${metadata.length}`);
  } finally {
    await browser.close();
  }
}
