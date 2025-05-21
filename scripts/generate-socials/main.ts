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

import { printHeader, colorize, coloredLog, icons } from "../lib/terminal";
import {
  extractMetadataForRoutes,
  extractAllMetadata,
  loadMetadataFromFile,
  saveMetadataToFile,
  checkMetadata,
  type SEOMetadata,
} from "./metadata";
import { generateOgImages } from "./social-card-generator";
import { getAllRoutes, getProjectRoot } from "../../src/lib/router-utils";
import { routeToFilename } from "../../src/lib/utils";
import { preprocessContent } from "../preprocess-content";
import fs from "fs";
import path from "path";

// Define interface for command line options
interface CommandOptions {
  all: boolean;
  update: boolean;
  regenerateImages: boolean;
  buildHtml: boolean;
  check: boolean;
  missing: boolean;
  only?: string;
}

// Parse arguments
const args = process.argv.slice(2);

// Help flag
if (args.includes("--help") || args.includes("-h") || args.length === 0) {
  showHelp();
  process.exit(0);
}

// Parse command-line options
const options: CommandOptions = {
  all: args.includes("--all"),
  update: args.includes("--update"),
  regenerateImages: args.includes("--regenerate-images"),
  buildHtml: args.includes("--build-html"),
  check: args.includes("--check"),
  missing: args.includes("--missing"),
  only: args.includes("--only") ? args[args.indexOf("--only") + 1] : undefined,
};

// Check that only one option was provided to avoid ambiguous execution
const enabledOptions = Object.entries(options).filter(
  ([key, value]) => key !== "only" && Boolean(value)
).length;

if (enabledOptions > 1) {
  console.error(`${colorize("Error:", "red")} Only one action option can be provided at a time.`);
  showHelp();
  process.exit(1);
}

/**
 * Regenerate all metadata and images
 */
async function regenerate() {
  try {
    // Extract all metadata
    const record = await extractAllMetadata(true);

    // Generate images for all routes
    await generateOgImages(Object.values(record));

    // Save metadata after successful image generation
    saveMetadataToFile(record);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${colorize("Failed to generate images:", "red")} ${errorMessage}`);
    console.error(`${colorize("Metadata not updated to maintain consistency", "yellow")}`);
    process.exit(1);
  }
}

/**
 * Update metadata and regenerate images only for changed routes
 */
async function updateChangedMetadata() {
  try {
    const oldRecord = loadMetadataFromFile();

    // Extract metadata using static rendering
    const newRecord = await extractAllMetadata(true);

    // Track routes needing different types of updates
    const routesNeedingImageRegen: string[] = [];
    const routesNeedingMetadataUpdate: string[] = [];
    const removedRoutes: string[] = [];

    // Check for new or modified routes
    for (const [route, newItem] of Object.entries(newRecord)) {
      // If the route doesn't exist in old record, it's new
      if (!oldRecord[route]) {
        routesNeedingImageRegen.push(route);
        continue;
      }

      const oldItem = oldRecord[route];

      // Only regenerate images if title changed (title appears in the image)
      if (oldItem.title !== newItem.title) {
        routesNeedingImageRegen.push(route);
      }
      // If only description changed, just update metadata without regenerating image
      else if (oldItem.description !== newItem.description) {
        routesNeedingMetadataUpdate.push(route);
      }
    }

    // Combine routes needing any kind of update
    const changedRoutes = [...routesNeedingImageRegen, ...routesNeedingMetadataUpdate];

    // Check for removed routes
    for (const [route, _] of Object.entries(oldRecord)) {
      if (!newRecord[route]) {
        removedRoutes.push(route);
      }
    }

    // Log a summary of changes
    if (changedRoutes.length > 0 || removedRoutes.length > 0) {
      printHeader("Route Changes", "green");

      if (changedRoutes.length > 0) {
        coloredLog(`${changedRoutes.length} routes added or updated:`, "green");
        changedRoutes.forEach((route) => {
          console.log(`  ${icons.success} ${route}`);
        });
      }

      if (removedRoutes.length > 0) {
        coloredLog(`${removedRoutes.length} routes removed:`, "yellow");
        removedRoutes.forEach((route) => {
          console.log(`  ${icons.warning} ${route}`);

          // Clean up any existing social card images for removed routes
          const projectRoot = getProjectRoot();
          const filename = routeToFilename(route);
          const imagePath = path.join(projectRoot, "public", "social-cards", `${filename}.webp`);

          if (fs.existsSync(imagePath)) {
            try {
              fs.unlinkSync(imagePath);
              console.log(`    ${icons.warning} Removed social card image`);
            } catch (error) {
              console.error(`    ${icons.error} Failed to remove social card image: ${error}`);
            }
          }
        });
      }

      // Handle routes that need updates
      if (changedRoutes.length > 0) {
        // Generate images only for routes that need image regeneration
        if (routesNeedingImageRegen.length > 0) {
          // Extract only the items that need image regeneration
          const itemsNeedingImages = routesNeedingImageRegen.map((route) => newRecord[route]);

          // Generate images only for routes that need it
          await generateOgImages(itemsNeedingImages);

          // Only save metadata after successful image generation to maintain consistency
          saveMetadataToFile(newRecord);

          coloredLog(
            `Regenerated ${routesNeedingImageRegen.length} images and updated metadata for all ${changedRoutes.length} routes.`,
            "green"
          );
        } else if (routesNeedingMetadataUpdate.length > 0) {
          // If we only have metadata updates (no image regeneration needed)
          saveMetadataToFile(newRecord);
          coloredLog(`Updated metadata for ${routesNeedingMetadataUpdate.length} routes.`, "green");
        }
      } else {
        // If we only removed routes (no additions/changes), we can safely update metadata
        saveMetadataToFile(newRecord);
        coloredLog("Routes removed and metadata updated.", "green");
      }
    } else {
      // No changes detected
      coloredLog("No routes have changed. No updates needed.", "green");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${colorize("Failed to update metadata:", "red")} ${errorMessage}`);
    process.exit(1);
  }
}

/**
 * Regenerate images using existing metadata
 */
async function regenerateImages() {
  try {
    const record = loadMetadataFromFile();
    const items = Object.values(record);

    await generateOgImages(items);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${colorize("Failed to regenerate images:", "red")} ${errorMessage}`);
    process.exit(1);
  }
}

/**
 * Handle specific route update
 */
async function handleSpecificRoute(route: string, verbose = true) {
  if (!route) {
    console.error(`${colorize("No route specified", "red")}`);
    process.exit(1);
  }

  if (verbose) {
    coloredLog(`Processing single route: ${route}`, "green");
  }

  try {
    // Get metadata for this specific route using static rendering
    const routeItems = await extractMetadataForRoutes([route], verbose);

    if (routeItems.length === 0) {
      console.error(`${colorize("Failed to extract metadata for route:", "red")} ${route}`);
      process.exit(1);
    }

    // Generate images for this route - we only update metadata if this succeeds
    await generateOgImages(routeItems, verbose);

    // Now that image generation has succeeded, we can safely update the metadata
    // Update the metadata record with this new/updated route
    const existingRecord = loadMetadataFromFile();

    // Add or update the route in the record
    const item = routeItems[0];
    existingRecord[route] = item;

    // Save the updated metadata
    saveMetadataToFile(existingRecord);

    if (verbose) {
      coloredLog(`Successfully updated metadata and images for route: ${route}`, "green");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${colorize("Error processing route:", "red")} ${errorMessage}`);
    process.exit(1);
  }
}

/**
 * Check for missing metadata or images
 */
async function performCheck() {
  const record = loadMetadataFromFile();
  const items = Object.values(record);

  // Check for routes with missing metadata
  const { routesWithoutTitle, routesWithoutDescription } = checkMetadata(items);

  // Check for routes missing from metadata
  const missingRoutes = await checkMissingRoutes(items);

  // Check for routes missing images
  const missingImages = await checkMissingImages(items);

  if (
    routesWithoutTitle.length === 0 &&
    routesWithoutDescription.length === 0 &&
    missingRoutes.length === 0 &&
    missingImages.length === 0
  ) {
    coloredLog("All checks passed! No issues found.", "green");
    return true;
  } else {
    coloredLog("Issues found. Run appropriate commands to fix.", "yellow");
    return false;
  }
}

/**
 * Check for routes that are missing images
 */
async function checkMissingImages(metadata: SEOMetadata[]): Promise<string[]> {
  const projectRoot = getProjectRoot();
  const missingImages: string[] = [];

  for (const item of metadata) {
    const route = item.route;
    const filename = routeToFilename(route);
    const imagePath = path.join(projectRoot, "public", "social-cards", `${filename}.webp`);

    if (!fs.existsSync(imagePath)) {
      missingImages.push(route);
    }
  }

  if (missingImages.length > 0) {
    printHeader("Routes Missing Images", "yellow");
    missingImages.forEach((route) => {
      console.log(`${icons.error} ${route}`);
    });
  } else {
    coloredLog("All routes have images", "green");
  }

  return missingImages;
}

/**
 * Check for routes that exist but aren't in metadata
 */
async function checkMissingRoutes(metadata: SEOMetadata[]): Promise<string[]> {
  const allRoutes = await getAllRoutes();
  const metadataRoutes = metadata.map((item) => item.route);

  const missingRoutes = allRoutes.filter((route) => !metadataRoutes.includes(route));

  if (missingRoutes.length > 0) {
    printHeader("Routes Missing From Metadata", "yellow");
    missingRoutes.forEach((route) => {
      console.log(`${icons.error} ${route}`);
    });
  } else {
    coloredLog("All routes have metadata", "green");
  }

  return missingRoutes;
}

/**
 * Process all routes that are missing from SEO metadata
 */
async function processMissingRoutes() {
  printHeader("Processing Missing Routes", "blue");

  try {
    // Load existing metadata
    const record = loadMetadataFromFile();
    const items = Object.values(record);

    // Get missing routes
    const missingRoutes = await checkMissingRoutes(items);

    if (missingRoutes.length === 0) {
      coloredLog("No missing routes to process!", "green");
      return;
    }

    coloredLog(`Found ${missingRoutes.length} missing routes to process`, "blue");

    // Process each missing route
    // Extract metadata for missing routes using static rendering
    const newItems = await extractMetadataForRoutes(missingRoutes, true);

    if (newItems.length === 0) {
      coloredLog("No metadata could be extracted for missing routes", "yellow");
      return;
    }

    // Generate images for the new routes (still needs browser)
    await generateOgImages(newItems);

    // Update the metadata record
    for (const item of newItems) {
      record[item.route] = item;
    }

    // Save updated metadata
    saveMetadataToFile(record);

    coloredLog(`Successfully processed ${newItems.length} missing routes`, "green");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${colorize("Failed to process missing routes:", "red")} ${errorMessage}`);
    process.exit(1);
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log("Usage: bun run generate-social [options]");
  console.log("");
  console.log("Options:");
  console.log("  --all                  Regenerate all metadata and images");
  console.log(
    "  --update               Update metadata and regenerate images only for changed routes"
  );
  console.log("  --regenerate-images    Regenerate all images using existing metadata");
  console.log("  --only <path>          Update specific route only");
  console.log("  --check                Check for missing metadata or images");
  console.log("  --missing              Process all routes missing from SEO metadata");
  console.log("  --build-html           Generate OG HTML files only (for build process)");
  console.log("  --help                 Show this help message");
  console.log("");
  console.log("Examples:");
  console.log("  bun run generate-social --all");
  console.log("  bun run generate-social --update");
  console.log("  bun run generate-social --only /blog/new-post");
  console.log("  bun run generate-social --check");
  console.log("  bun run generate-social --missing");
}

/**
 * Run content preprocessing to ensure we have the latest blog posts
 */
async function ensureContentPreprocessed() {
  printHeader("Preprocessing Content", "blue");

  try {
    // Run preprocessContent with verbose=false to reduce noise
    await preprocessContent(false);
    coloredLog("Content preprocessing complete", "green");
  } catch (error) {
    throw new Error(`Failed to preprocess content: ${error}`);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Ensure content is preprocessed before running any commands
    await ensureContentPreprocessed();

    if (options.all) {
      await regenerate();
    } else if (options.update) {
      await updateChangedMetadata();
    } else if (options.regenerateImages) {
      await regenerateImages();
    } else if (options.only) {
      // For the --only option, use minimal verbosity
      await handleSpecificRoute(options.only, true);
    } else if (options.check) {
      const passed = await performCheck();
      if (!passed) {
        process.exit(1);
      }
    } else if (options.missing) {
      await processMissingRoutes();
    } else {
      coloredLog("No valid option specified. Use --help for usage information.", "yellow");
      process.exit(1);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`${colorize("Error:", "red")} ${errorMessage}`);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`${colorize("Unhandled error:", "red")} ${errorMessage}`);
  process.exit(1);
});
