#!/usr/bin/env bun
/**
 * Unified social media generation tool
 *
 * Supports:
 * --all                  : Regenerate all metadata and images
 * --update               : Update metadata and regenerate images only for changed routes
 * --regenerate-images    : Regenerate all images using existing metadata
 * --only <path>          : Update specific route only
 * --check                : Check for missing metadata or images
 * --help                 : Show help
 */

import { colorize, coloredLog } from "../lib/terminal";
import { generateOgImages } from "./social-card-generator";
import { getAllRoutes, getProjectRoot } from "../../src/lib/router-utils";
import { renderRouteToString } from "../../src/lib/rendering";
import fs from "fs";
import path from "path";

/**
 * Metadata structure with title and description
 */
interface RouteMetadata {
  route: string;
  title: string;
  description: string | null;
}

/**
 * Extract metadata for a single route
 */
async function extractRouteMetadata(route: string): Promise<RouteMetadata> {
  const { metadata } = await renderRouteToString(route);

  // If we don't have a title, that's a critical error
  if (!metadata.title) {
    throw new Error(`Failed to extract title for route: ${route}`);
  }

  return {
    route,
    title: metadata.title,
    description: metadata.description || null,
  };
}

/**
 * Save metadata to file as an array
 */
function saveMetadataToFile(metadata: RouteMetadata[], verbose = false): string {
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
 * Main function
 */
async function main() {
  // Get all routes
  const allRoutes = await getAllRoutes();

  // Map to title for social card generation
  const socialCardPromises = allRoutes.map((route) => extractRouteMetadata(route));

  // Wait for all metadata to be extracted
  const metadataList = await Promise.all(socialCardPromises);

  // Save full metadata (with descriptions) to file
  saveMetadataToFile(metadataList, true);

  console.log(`Generated metadata for ${metadataList.length} routes`);

  // Generate social card images (only needs route and title)
  await generateOgImages(metadataList);
}

// Run the main function
main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`${colorize("Unhandled error:", "red")} ${errorMessage}`);
  process.exit(1);
});
