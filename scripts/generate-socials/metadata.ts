/**
 * Social Media Metadata Management
 *
 * This module handles SEO metadata extraction and management,
 * scraping metadata and storing results.
 */

import { Browser } from "puppeteer";
import fs from "fs";
import path from "path";
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

// Options for metadata extraction
export interface MetadataOptions {
  verbose?: boolean;
}

/**
 * Extract SEO metadata from a page using Puppeteer
 */
async function extractPageMetadata(
  browser: Browser,
  route: string,
  baseUrl: string
): Promise<SEOMetadata> {
  // Create a new page for this extraction
  const page = await browser.newPage();

  try {
    const url = new URL(route, baseUrl).toString();

    // Navigate to the page and wait for it to load
    await page.goto(url, { waitUntil: "networkidle0" });

    // Add extra delay to ensure JavaScript has fully executed and content is loaded
    await new Promise((resolve) => setTimeout(resolve, 200));

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
  } finally {
    // Close the page when done
    await page.close();
  }
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
 *
 * @param browser - Puppeteer browser instance
 * @param routes - Array of routes to process
 * @param port - Port the development server is running on
 * @param verbose - Whether to output detailed logs
 */
export async function extractMetadataForRoutes(
  browser: Browser,
  routes: string[],
  port: number,
  verbose = true
): Promise<SEOMetadata[]> {
  const baseUrl = `http://localhost:${port}`;

  try {
    // Extract metadata for each route
    if (verbose) {
      printHeader("Extracting Metadata", "blue");
    }

    const metadata: SEOMetadata[] = [];
    let failedRoutes = 0;

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      if (verbose) {
        console.log(
          `${colorize(`[${i + 1}/${routes.length}]`, "cyan")} Processing route: ${route}`
        );
      }

      try {
        const pageMetadata = await extractPageMetadata(browser, route, baseUrl);
        metadata.push(pageMetadata);

        if (verbose) {
          console.log(`  ${icons.success} Title: ${pageMetadata.title}`);
          console.log(`  ${icons.success} Description: ${pageMetadata.description || "Not found"}`);
        }
      } catch (error) {
        console.error(`  ${icons.error} Failed to extract metadata for ${route}: ${error}`);
        failedRoutes++;
      }
    }

    if (verbose) {
      if (failedRoutes > 0) {
        coloredLog(`Failed to process ${failedRoutes} routes`, "yellow");
        coloredLog("Use --check to identify missing routes", "yellow");
      }
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
 *
 * @param browser - Puppeteer browser instance
 * @param port - Port the development server is running on
 * @param verbose - Whether to output detailed logs
 */
export async function extractAllMetadata(
  browser: Browser,
  port: number,
  verbose = true
): Promise<MetadataRecord> {
  // Get all routes in the site
  const allRoutes = await getAllRoutes();

  // Extract metadata for all routes
  const items = await extractMetadataForRoutes(browser, allRoutes, port, verbose);

  // Convert to record
  const record: MetadataRecord = {};
  for (const item of items) {
    record[item.route] = item;
  }

  // Check for missing routes
  if (verbose) {
    const processedRoutes = new Set(items.map((item) => item.route));
    const missingRoutes = allRoutes.filter((route) => !processedRoutes.has(route));

    if (missingRoutes.length > 0) {
      coloredLog(`Warning: ${missingRoutes.length} routes are missing metadata`, "yellow");
      missingRoutes.forEach((route) => {
        console.log(`  ${icons.warning} Missing: ${route}`);
      });
      coloredLog("Use --check for more details", "yellow");
    }
  }

  return record;
}

/**
 * Save metadata record to file
 */
export function saveMetadataToFile(metadata: MetadataRecord, verbose = false): string {
  // Ensure the output directory exists
  const projectRoot = getProjectRoot();
  const outputDir = path.join(projectRoot, "public");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "seo-metadata.json");
  // Add a newline at the end to match Prettier's formatting
  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2) + "\n");

  if (verbose) {
    coloredLog(`SEO metadata saved to: ${outputPath}`, "green");
  }

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
