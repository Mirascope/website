/**
 * Social Media Metadata Management
 *
 * This module handles SEO metadata extraction and management using
 * static rendering with React and Helmet, consistent with prerender.ts.
 */

import fs from "fs";
import path from "path";
import { getAllRoutes, getProjectRoot } from "../../src/lib/router-utils";
import { printHeader, coloredLog, colorize, icons } from "../lib/terminal";
import { renderRouteToString } from "../../src/lib/rendering";

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
 * Extract SEO metadata using static rendering with React and Helmet
 */
async function extractPageMetadata(route: string, verbose: boolean = false): Promise<SEOMetadata> {
  try {
    // Use the shared rendering utility to render the route and extract metadata
    const { metadata } = await renderRouteToString(route, verbose);

    // If we don't have a title, that's a critical error
    if (!metadata.title) {
      throw new Error(`Failed to extract title for route: ${route}`);
    }

    // Every page should have a description too.
    if (!metadata.description) {
      throw new Error(`Failed to extract description for route: ${route}`);
    }

    return {
      route,
      title: metadata.title,
      description: metadata.description,
    };
  } catch (error) {
    // Re-throw the error to ensure we don't silently continue with bad data
    console.error(`Error extracting metadata for ${route}:`, error);
    throw new Error(`Failed to extract metadata for route: ${route} - ${error}`);
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
 * @param routes - Array of routes to process
 * @param verbose - Whether to output detailed logs
 */
export async function extractMetadataForRoutes(
  routes: string[],
  verbose = true
): Promise<SEOMetadata[]> {
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
        const pageMetadata = await extractPageMetadata(route, verbose);
        metadata.push(pageMetadata);

        if (verbose) {
          console.log(`  ${icons.success} Title: ${pageMetadata.title}`);
          console.log(`  ${icons.success} Description: ${pageMetadata.description || "Not found"}`);
        }
      } catch (error) {
        console.error(`  ${icons.error} Failed to extract metadata for ${route}: ${error}`);
        failedRoutes++;

        // Instead of silently continuing with bad data, throw an error if any route fails
        // This ensures the entire process stops rather than generating partial results
        if (failedRoutes > 0) {
          throw new Error(
            `Failed to extract metadata for ${failedRoutes} routes. Fix the issues before proceeding.`
          );
        }
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
 * @param verbose - Whether to output detailed logs
 */
export async function extractAllMetadata(verbose = true): Promise<MetadataRecord> {
  // Get all routes in the site
  const allRoutes = await getAllRoutes();

  // Extract metadata for all routes
  const items = await extractMetadataForRoutes(allRoutes, verbose);

  // Convert to record
  const record: MetadataRecord = {};
  for (const item of items) {
    record[item.route] = item;
  }

  // Double-check for missing routes (should be none since we're throwing errors)
  if (verbose) {
    const processedRoutes = new Set(items.map((item) => item.route));
    const missingRoutes = allRoutes.filter((route) => !processedRoutes.has(route));

    if (missingRoutes.length > 0) {
      // This should not happen since we now throw errors when extraction fails
      coloredLog(`Warning: ${missingRoutes.length} routes are missing metadata`, "red");
      missingRoutes.forEach((route) => {
        console.log(`  ${icons.error} Missing: ${route}`);
      });

      // Throw an error to make this a critical failure rather than just a warning
      throw new Error(
        `${missingRoutes.length} routes are missing metadata. This should not happen.`
      );
    } else {
      coloredLog("All routes have metadata extracted successfully", "green");
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
