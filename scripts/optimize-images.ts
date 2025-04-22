#!/usr/bin/env bun
/**
 * Image Optimization Script
 *
 * This script optimizes images in the public directory:
 * 1. Converts PNG & JPG images to WebP format
 * 2. Creates responsive versions of specific image types
 * 3. Preserves original files (for browsers that don't support WebP)
 */

import path from "path";
import fs from "fs";
import { glob } from "glob";
import sharp from "sharp";

// Configuration
const CONFIG = {
  // Base directory to process - these are the built assets in dist
  baseDirectory: "dist/assets",

  // Quality settings
  quality: {
    webp: 80,
    jpeg: 85,
    png: 85,
  },

  // Responsive image configurations based on path patterns
  responsiveConfigs: [
    {
      // Background images get three sizes with larger medium breakpoint
      pattern: /\/backgrounds\//,
      sizes: [
        { name: "large", width: null }, // Original size
        { name: "medium", width: 1200 },
        { name: "small", width: 800 },
      ],
    },
    {
      // Default responsive sizes for all other images
      pattern: /.*/, // Match all paths
      sizes: [
        { name: "large", width: null }, // Original size
        { name: "medium", width: 1024 },
        { name: "small", width: 640 },
      ],
    },
  ],

  // Skip patterns if needed in the future
  skipPatterns: [] as RegExp[],
};

// File counters
let stats = {
  processed: 0,
  skipped: 0,
  errors: 0,
  sizeBefore: 0,
  sizeAfter: 0,
};

/**
 * Get responsive image sizes based on file path
 * Returns the most specific pattern match first
 */
function getResponsiveConfig(filePath: string) {
  // Try to find a specific pattern match first
  // The default pattern (/.*//) should be last in the config array
  for (let i = 0; i < CONFIG.responsiveConfigs.length - 1; i++) {
    const config = CONFIG.responsiveConfigs[i];
    if (config.pattern.test(filePath)) {
      return config.sizes;
    }
  }

  // Use default pattern if no specific matches
  return CONFIG.responsiveConfigs[CONFIG.responsiveConfigs.length - 1].sizes;
}

/**
 * Check if a file should be skipped
 */
function shouldSkipFile(filePath: string): boolean {
  // Skip files that match skip patterns
  if (CONFIG.skipPatterns.some((pattern) => pattern.test(filePath))) {
    return true;
  }

  // Skip SVG and GIF files - we don't want to convert these to WebP
  // They should be served as-is
  const extension = path.extname(filePath).toLowerCase();
  if ([".svg", ".gif"].includes(extension)) {
    return true;
  }

  return false;
}

/**
 * Process a single image file
 */
async function processImage(filePath: string) {
  // Skip if matches any pattern in the excluded list
  if (shouldSkipFile(filePath)) {
    console.log(`⏭️  Skipping: ${filePath}`);
    stats.skipped++;
    return;
  }

  try {
    const fileExt = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, fileExt);
    const dirName = path.dirname(filePath);
    const responsiveSizes = getResponsiveConfig(filePath);

    console.log(`🖼️  Processing: ${filePath}`);

    // Get original file size
    const fileStats = fs.statSync(filePath);
    stats.sizeBefore += fileStats.size;

    // Create webp versions in all appropriate sizes
    for (const size of responsiveSizes) {
      const resizeOptions = size.width ? { width: size.width } : undefined;
      const suffix = size.name === "large" ? "" : `-${size.name}`;
      const outputPath = path.join(dirName, `${baseName}${suffix}.webp`);

      // Process the image
      try {
        let sharpInstance = sharp(filePath);
        const metadata = await sharpInstance.metadata();

        // Determine if resize is needed
        const needsResize =
          resizeOptions &&
          resizeOptions.width &&
          metadata.width &&
          resizeOptions.width < metadata.width;

        // Apply resize if needed
        if (needsResize) {
          sharpInstance = sharpInstance.resize(resizeOptions);
        }

        // Always output as WebP with quality setting
        await sharpInstance.webp({ quality: CONFIG.quality.webp }).toFile(outputPath);

        console.log(`✅  Created: ${outputPath}`);

        // Track size of the original-sized WebP (large) for stats
        if (size.name === "large") {
          const webpStats = fs.statSync(outputPath);
          stats.sizeAfter += webpStats.size;
        }
      } catch (error) {
        console.error(`❌  Error processing ${outputPath}:`, error);
        stats.errors++;
      }
    }

    stats.processed++;
  } catch (error) {
    console.error(`❌  Error processing ${filePath}:`, error);
    stats.errors++;
  }
}

/**
 * Main function to run the optimization
 */
async function main() {
  console.log("🚀 Starting image optimization...");

  const startTime = Date.now();

  // Make sure the base directory exists
  if (!fs.existsSync(CONFIG.baseDirectory)) {
    console.error(
      `❌ Error: Base directory ${CONFIG.baseDirectory} does not exist. The build may have failed or no assets were copied.`
    );
    process.exit(1);
  }

  // Find all images recursively in the base directory
  const imageFiles = await glob(`${CONFIG.baseDirectory}/**/*.{png,jpg,jpeg,webp}`, {
    absolute: true,
  });
  console.log(`📁 Found ${imageFiles.length} images in ${CONFIG.baseDirectory}`);

  // Process images in parallel, but with a limit
  const batchSize = 5; // Process 5 images at a time
  for (let i = 0; i < imageFiles.length; i += batchSize) {
    const batch = imageFiles.slice(i, i + batchSize);
    await Promise.all(batch.map((file) => processImage(file)));
  }

  const endTime = Date.now();
  const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

  // Calculate savings
  const savingsBytes = stats.sizeBefore - stats.sizeAfter;
  const savingsPercent = stats.sizeBefore
    ? ((savingsBytes / stats.sizeBefore) * 100).toFixed(1)
    : "0";
  const sizeBefore = (stats.sizeBefore / (1024 * 1024)).toFixed(2);
  const sizeAfter = (stats.sizeAfter / (1024 * 1024)).toFixed(2);

  // Log results
  console.log("\n🎉 Image optimization complete!");
  console.log(`⏱️  Duration: ${durationSeconds}s`);
  console.log(
    `📊 Processed: ${stats.processed} images, Skipped: ${stats.skipped}, Errors: ${stats.errors}`
  );
  console.log(`💾 Size reduction: ${sizeBefore} MB → ${sizeAfter} MB (${savingsPercent}% saved)`);

  if (stats.errors > 0) {
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
