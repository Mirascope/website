/**
 * Extract SEO metadata from all routes using Puppeteer
 *
 * This script:
 * 1. Starts a local dev server
 * 2. Uses route enumeration to get all routes
 * 3. Visits each route with Puppeteer
 * 4. Extracts title, description, image URL
 * 5. Generates a manifest file with the metadata
 */

import { Page, launch } from "puppeteer";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { getAllRoutes, getProjectRoot } from "../src/lib/router-utils";

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
 * Wait for the development server to be ready
 */
async function waitForServer(port: number, maxWaitTimeMs: number = 30000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < maxWaitTimeMs) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);

      const response = await fetch(`http://localhost:${port}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        return true;
      }
    } catch (e) {
      // Retry
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return false;
}

/**
 * Start the development server
 */
async function startDevServer(port: number): Promise<any> {
  console.log(`${CYAN}Starting development server on port ${port}...${RESET}`);

  const devServer = spawn("bun", ["run", "dev", "--port", port.toString()], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  devServer.stdout.on("data", (data) => {
    console.log(`${YELLOW}[Dev Server]${RESET} ${data.toString().trim()}`);
  });

  devServer.stderr.on("data", (data) => {
    console.error(`${RED}[Dev Server Error]${RESET} ${data.toString().trim()}`);
  });

  const serverReady = await waitForServer(port);
  if (!serverReady) {
    throw new Error(`Development server failed to start within timeout`);
  }

  console.log(`${GREEN}Development server started${RESET}`);

  return devServer;
}

/**
 * Extract SEO metadata from a page using Puppeteer
 */
async function extractPageMetadata(
  page: Page,
  route: string,
  baseUrl: string
): Promise<SEOMetadata> {
  const url = new URL(route, baseUrl).toString();
  console.log(`${BLUE}Visiting${RESET} ${url}`);

  // Navigate to the page and wait for it to load
  await page.goto(url, { waitUntil: "networkidle0" });

  // Extract metadata
  const metadata = await page.evaluate(() => {
    // Helper to get meta tag content
    const getMetaContent = (name: string): string | null => {
      const element = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return element ? element.getAttribute("content") : null;
    };

    return {
      title: document.title,
      description: getMetaContent("description"),
      image: getMetaContent("image"),
      ogTitle: getMetaContent("og:title"),
      ogDescription: getMetaContent("og:description"),
      ogImage: getMetaContent("og:image"),
    };
  });

  return {
    route,
    title: metadata.title,
    description: metadata.description,
    image: metadata.image,
    ogTitle: metadata.ogTitle,
    ogDescription: metadata.ogDescription,
    ogImage: metadata.ogImage,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Main function
 */
async function main() {
  const DEV_SERVER_PORT = 33330; // Use a unique port to avoid conflicts
  const BASE_URL = `http://localhost:${DEV_SERVER_PORT}`;

  printHeader("SEO Metadata Extraction", CYAN);

  try {
    // Start development server
    const devServer = await startDevServer(DEV_SERVER_PORT);

    // Launch Puppeteer
    printHeader("Launching Puppeteer", BLUE);
    const browser = await launch({
      headless: true,
    });

    // Get all routes
    printHeader("Getting Routes", BLUE);
    const routesToProcess = await getAllRoutes();
    console.log(`${GREEN}Found ${routesToProcess.length} routes to process${RESET}`);

    // Create a new page
    const page = await browser.newPage();

    // Extract metadata for each route
    printHeader("Extracting Metadata", BLUE);
    const metadata: SEOMetadata[] = [];

    for (let i = 0; i < routesToProcess.length; i++) {
      const route = routesToProcess[i];
      console.log(`${CYAN}[${i + 1}/${routesToProcess.length}]${RESET} Processing route: ${route}`);

      try {
        const pageMetadata = await extractPageMetadata(page, route, BASE_URL);
        metadata.push(pageMetadata);

        console.log(`  ${GREEN}✓${RESET} Title: ${pageMetadata.title}`);
        console.log(`  ${GREEN}✓${RESET} Description: ${pageMetadata.description || "Not found"}`);
      } catch (error) {
        console.error(`  ${RED}✗${RESET} Failed to extract metadata for ${route}: ${error}`);

        // Add a placeholder entry so we know this route was attempted
        metadata.push({
          route,
          title: `Failed to extract: ${route}`,
          description: null,
          image: null,
          ogTitle: null,
          ogDescription: null,
          ogImage: null,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    // Write metadata to file
    printHeader("Saving Metadata", BLUE);

    // Ensure the output directory exists
    const outputDir = path.join(getProjectRoot(), "public");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, "seo-metadata.json");
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));

    console.log(`${GREEN}SEO metadata saved to: ${outputPath}${RESET}`);

    // Close the browser and server
    await browser.close();

    // Kill the dev server process and all its children
    process.kill(-devServer.pid);

    printHeader("SEO Metadata Extraction Complete", GREEN);
    console.log(`${GREEN}Successfully processed ${metadata.length} routes${RESET}`);

    // Summarize routes without proper metadata
    const routesWithoutTitle = metadata.filter(
      (item) => !item.title || item.title.includes("Failed to extract")
    );
    const routesWithoutDescription = metadata.filter(
      (item) => !item.description && !item.ogDescription
    );

    if (routesWithoutTitle.length > 0 || routesWithoutDescription.length > 0) {
      printHeader("Routes With Missing Metadata", YELLOW);

      if (routesWithoutTitle.length > 0) {
        console.log(`${YELLOW}Routes without titles: ${routesWithoutTitle.length}${RESET}`);
        routesWithoutTitle.forEach((item) => {
          console.log(`  ${RED}✗${RESET} ${item.route}`);
        });
      }

      if (routesWithoutDescription.length > 0) {
        console.log(
          `\n${YELLOW}Routes without descriptions: ${routesWithoutDescription.length}${RESET}`
        );
        routesWithoutDescription.forEach((item) => {
          console.log(`  ${RED}✗${RESET} ${item.route} (${item.title})`);
        });
      }
    }
  } catch (error) {
    console.error(`\n${RED}Error extracting SEO metadata: ${error}${RESET}`);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
