/**
 * Social Media Metadata Management
 *
 * This module handles SEO metadata extraction and management,
 * including launching a dev server, scraping metadata, and storing results.
 */

import { Page, launch } from "puppeteer";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { getAllRoutes, getProjectRoot } from "../../src/lib/router-utils";
import { printHeader, coloredLog, colorize, icons } from "../lib/terminal";

// SEO metadata interface
export interface SEOMetadata {
  route: string;
  title: string;
  description: string | null;
}

// Metadata collection as a record for O(1) lookups
export type MetadataRecord = Record<string, SEOMetadata>;

const DEFAULT_PORT = 3939;

/**
 * Wait for the development server to be ready
 */
async function waitForServer(port = DEFAULT_PORT, maxWaitTimeMs: number = 30000): Promise<boolean> {
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
async function startDevServer(port = DEFAULT_PORT): Promise<any> {
  coloredLog(`Starting development server on port ${port}...`, "cyan");

  const devServer = spawn("bun", ["run", "dev", "--port", port.toString()], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });

  devServer.stdout.on("data", (data) => {
    console.log(`${colorize("[Dev Server]", "yellow")} ${data.toString().trim()}`);
  });

  devServer.stderr.on("data", (data) => {
    console.error(`${colorize("[Dev Server Error]", "red")} ${data.toString().trim()}`);
  });

  const serverReady = await waitForServer(port);
  if (!serverReady) {
    throw new Error(`Development server failed to start within timeout`);
  }

  coloredLog("Development server started", "green");

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
  console.log(`${colorize("Visiting", "blue")} ${url}`);

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
    };
  });

  return {
    route,
    title: metadata.title,
    description: metadata.description,
  };
}

/**
 * Convert array of metadata to record with safety checks
 */
export async function arrayToMetadataRecord(items: SEOMetadata[]): Promise<MetadataRecord> {
  // Create the record
  const record: MetadataRecord = {};

  // Add all items to the record
  for (const item of items) {
    record[item.route] = item;
  }

  // Safety check - verify all routes are in the record
  const allRoutes = await getAllRoutes();
  const missingRoutes = allRoutes.filter((route) => !record[route]);

  if (missingRoutes.length > 0) {
    coloredLog(`Warning: ${missingRoutes.length} routes are missing metadata`, "yellow");
    missingRoutes.forEach((route) => {
      console.log(`  ${icons.warning} Missing: ${route}`);
    });
  }

  return record;
}

/**
 * Extract metadata for specific routes only
 * Returns an array of SEOMetadata objects for the successfully processed routes
 */
export async function extractMetadataForRoutes(
  routes: string[],
  port = DEFAULT_PORT
): Promise<SEOMetadata[]> {
  const baseUrl = `http://localhost:${port}`;

  printHeader("SEO Metadata Extraction", "cyan");

  try {
    // Start development server
    const devServer = await startDevServer(port);

    // Launch Puppeteer
    printHeader("Launching Puppeteer", "blue");
    const browser = await launch({
      headless: true,
    });

    coloredLog(`Processing ${routes.length} routes`, "green");

    // Create a new page
    const page = await browser.newPage();

    // Extract metadata for each route
    printHeader("Extracting Metadata", "blue");
    const metadata: SEOMetadata[] = [];
    let failedRoutes = 0;

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      console.log(`${colorize(`[${i + 1}/${routes.length}]`, "cyan")} Processing route: ${route}`);

      try {
        const pageMetadata = await extractPageMetadata(page, route, baseUrl);
        metadata.push(pageMetadata);

        console.log(`  ${icons.success} Title: ${pageMetadata.title}`);
        console.log(`  ${icons.success} Description: ${pageMetadata.description || "Not found"}`);
      } catch (error) {
        console.error(`  ${icons.error} Failed to extract metadata for ${route}: ${error}`);
        failedRoutes++;
      }
    }

    // Close the browser and server
    await browser.close();

    // Kill the dev server process and all its children
    process.kill(-devServer.pid);

    printHeader("SEO Metadata Extraction Complete", "green");
    coloredLog(`Successfully processed ${metadata.length} routes`, "green");

    if (failedRoutes > 0) {
      coloredLog(`Failed to process ${failedRoutes} routes`, "yellow");
      coloredLog("Use --check to identify missing routes", "yellow");
    }

    return metadata;
  } catch (error) {
    console.error(`\n${colorize("Error extracting SEO metadata:", "red")} ${error}`);
    throw error;
  }
}

/**
 * Extract metadata for all routes and build a complete metadata record
 * Returns a metadata record for all successfully processed routes
 */
export async function extractAllMetadata(port = DEFAULT_PORT): Promise<MetadataRecord> {
  // Get all routes in the site
  const allRoutes = await getAllRoutes();

  // Extract metadata for all routes
  const items = await extractMetadataForRoutes(allRoutes, port);

  // Convert to record
  const record: MetadataRecord = {};
  for (const item of items) {
    record[item.route] = item;
  }

  // Check for missing routes
  const processedRoutes = new Set(items.map((item) => item.route));
  const missingRoutes = allRoutes.filter((route) => !processedRoutes.has(route));

  if (missingRoutes.length > 0) {
    coloredLog(`Warning: ${missingRoutes.length} routes are missing metadata`, "yellow");
    missingRoutes.forEach((route) => {
      console.log(`  ${icons.warning} Missing: ${route}`);
    });
    coloredLog("Use --check for more details", "yellow");
  }

  return record;
}

/**
 * Save metadata record to file
 */
export function saveMetadataToFile(metadata: MetadataRecord): string {
  printHeader("Saving Metadata", "blue");

  // Ensure the output directory exists
  const projectRoot = getProjectRoot();
  const outputDir = path.join(projectRoot, "public");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "seo-metadata.json");
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));

  coloredLog(`SEO metadata saved to: ${outputPath}`, "green");
  return outputPath;
}

/**
 * Load metadata from file
 * Returns the complete MetadataRecord containing all routes
 */
export function loadMetadataFromFile(): MetadataRecord {
  const projectRoot = getProjectRoot();
  const metadataPath = path.join(projectRoot, "public", "seo-metadata.json");

  if (!fs.existsSync(metadataPath)) {
    throw new Error(`Metadata file not found: ${metadataPath}`);
  }

  const rawMetadata = fs.readFileSync(metadataPath, "utf-8");
  return JSON.parse(rawMetadata) as MetadataRecord;
}

/**
 * Check for routes with missing metadata
 */
export function checkMetadata(metadata: SEOMetadata[]): {
  routesWithoutTitle: SEOMetadata[];
  routesWithoutDescription: SEOMetadata[];
} {
  // Check for routes with missing metadata
  const routesWithoutTitle = metadata.filter(
    (item) => !item.title || item.title.includes("Failed to extract")
  );

  const routesWithoutDescription = metadata.filter((item) => !item.description);

  if (routesWithoutTitle.length > 0 || routesWithoutDescription.length > 0) {
    printHeader("Routes With Missing Metadata", "yellow");

    if (routesWithoutTitle.length > 0) {
      coloredLog(`Routes without titles: ${routesWithoutTitle.length}`, "yellow");
      routesWithoutTitle.forEach((item) => {
        console.log(`  ${icons.error} ${item.route}`);
      });
    }

    if (routesWithoutDescription.length > 0) {
      coloredLog(`Routes without descriptions: ${routesWithoutDescription.length}`, "yellow");
      routesWithoutDescription.forEach((item) => {
        console.log(`  ${icons.error} ${item.route} (${item.title})`);
      });
    }
  } else {
    coloredLog("All routes have proper titles and descriptions", "green");
  }

  return { routesWithoutTitle, routesWithoutDescription };
}
