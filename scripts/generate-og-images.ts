/**
 * Generate Open Graph images for all routes using Puppeteer
 *
 * This script:
 * 1. Reads the SEO metadata from the manifest file
 * 2. Creates OG images for each route with Puppeteer
 * 3. Stores them in the public/social-cards directory
 */

import { launch, Browser } from "puppeteer";
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

const PROJECT_ROOT = path.join(__dirname, "..");

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
    const assetPath = path.join(PROJECT_ROOT, "public", relativePath);
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
  const backgroundImage = loadAssetAsBase64("dark-mode-watercolor-background.png");
  const logoImage = loadAssetAsBase64("frog-logo.png");
  const fontData = loadAssetAsBase64("fonts/Williams-Handwriting-Regular-v1.ttf");

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
async function generateOgImage(
  browser: Browser,
  route: string,
  title: string,
  description: string | null,
  outputDir: string
): Promise<string> {
  // Import the shared route-to-filename function from useSEO hook
  // (recreate the function here to avoid import issues)
  function routeToImagePath(route: string): string {
    return route === "/" ? "index" : route.replace(/^\//, "").replace(/\//g, "-");
  }

  // Create a safe filename
  const filename = routeToImagePath(route);

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
 * Main function
 */
async function main() {
  printHeader("OG Image Generation", CYAN);

  try {
    // Check if metadata file exists
    const projectRoot = getProjectRoot();
    const metadataPath = path.join(projectRoot, "public", "seo-metadata.json");

    if (!fs.existsSync(metadataPath)) {
      console.error(`${RED}Metadata file not found: ${metadataPath}${RESET}`);
      console.error(`${YELLOW}Run extract-seo-metadata.ts first to generate the metadata${RESET}`);
      process.exit(1);
    }

    // Read metadata
    const rawMetadata = fs.readFileSync(metadataPath, "utf-8");
    const metadata: SEOMetadata[] = JSON.parse(rawMetadata);

    console.log(`${GREEN}Found metadata for ${metadata.length} routes${RESET}`);

    // Prepare output directory
    const outputDir = path.join(projectRoot, "public", "social-cards");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Launch Puppeteer
    printHeader("Launching Puppeteer", BLUE);
    const browser = await launch({
      headless: true,
    });

    // Generate OG images
    printHeader("Generating OG Images", BLUE);
    let successCount = 0;

    for (let i = 0; i < metadata.length; i++) {
      const item = metadata[i];
      console.log(`${CYAN}[${i + 1}/${metadata.length}]${RESET} Processing route: ${item.route}`);

      try {
        // Use the most appropriate title and description
        const title = item.ogTitle || item.title || "Mirascope";
        const description = item.ogDescription || item.description;

        if (!title || title.includes("Failed to extract")) {
          console.log(`${YELLOW}⚠ Skipping route with missing title: ${item.route}${RESET}`);
          continue;
        }

        const outputPath = await generateOgImage(
          browser,
          item.route,
          title,
          description,
          outputDir
        );

        const relativePath = path.relative(projectRoot, outputPath);
        console.log(`${GREEN}✓${RESET} Generated: ${relativePath}`);
        successCount++;
      } catch (error) {
        console.error(`${RED}✗${RESET} Failed to generate OG image for ${item.route}: ${error}`);
      }
    }

    // Generate a default social image if it doesn't exist
    const defaultImagePath = path.join(projectRoot, "public", "social-cards", "_default.png");
    if (!fs.existsSync(defaultImagePath)) {
      console.log(`${YELLOW}Creating default social image...${RESET}`);

      // Create the directory if it doesn't exist
      const defaultDir = path.dirname(defaultImagePath);
      if (!fs.existsSync(defaultDir)) {
        fs.mkdirSync(defaultDir, { recursive: true });
      }

      // Generate with standard branding
      await generateOgImage(
        browser,
        "/",
        "Mirascope",
        "The AI Engineer's Developer Stack",
        path.dirname(defaultImagePath)
      );
      console.log(`${GREEN}✓${RESET} Created default social image`);
    }

    // Close the browser
    await browser.close();

    printHeader("OG Image Generation Complete", GREEN);
    console.log(`${GREEN}Successfully generated ${successCount} OG images${RESET}`);
  } catch (error) {
    console.error(`\n${RED}Error generating OG images: ${error}${RESET}`);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
