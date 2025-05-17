#!/usr/bin/env bun

/**
 * Generate Python code snippets from MDX documentation.
 *
 * It always:
 * - Cleans the output directory
 * - Extracts all snippets from mdx files in the content directory
 * - Outputs to .extracted-snippets directory (not checked into git)
 *
 * Usage:
 *   bun run scripts/generate-snippets       # Generate all snippets
 *   bun run scripts/generate-snippets -- --verbose  # Show more detailed output
 *
 * Exit codes:
 *   0: Success (all snippets generated)
 *   1: Error (some snippets failed to generate)
 */

import * as fs from "fs";
import * as path from "path";

// Import our low-level extraction functions
import { processFile } from "./lib/snippet-extractor";

// Root directory for extracted snippets (changed to .extracted-snippets)
const SNIPPETS_ROOT = path.join(process.cwd(), ".extracted-snippets");

// Docs root directory
const CONTENT_ROOT = path.join(process.cwd(), "content");

const IGNORED_PATHS = [
  "content/blog",
  "content/docs/mirascope/guides",
  "content/docs/mirascope/api",
  "content/docs/lilypad",
  "content/dev",
];

/**
 * Recursively find all MDX files in a directory
 */
function findMdxFilesRecursive(directory: string, relativePath: string = ""): string[] {
  const paths: string[] = [];

  // Read all entries in the directory
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;

    if (entry.isDirectory()) {
      // Skip node_modules and hidden directories
      if (entry.name === "node_modules" || entry.name.startsWith(".")) {
        continue;
      }

      // Recursively scan subdirectories
      paths.push(...findMdxFilesRecursive(fullPath, relPath));
    } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
      paths.push(fullPath);
    }
  }

  return paths;
}

/**
 * Generate snippets for a single doc
 */
function generateDocSnippets(filePath: string, verbose = false): boolean {
  try {
    // Extract new snippets
    const files = processFile(filePath);

    if (files.length > 0) {
      if (verbose) {
        console.log(`Generated ${files.length} snippets for ${filePath}`);
      }
      return true;
    } else {
      if (verbose) {
        // Since we try generating snippets for every mdx file, this is expected.
        console.log(`No snippets found in ${filePath}`);
      }
      return true;
    }
  } catch (error) {
    console.error(`Error generating snippets for ${filePath}:`, error);
    return false;
  }
}

/**
 * Clean the output directory
 */
function cleanOutputDirectory(): void {
  if (fs.existsSync(SNIPPETS_ROOT)) {
    console.log(`Cleaning output directory: ${SNIPPETS_ROOT}`);
    fs.rmSync(SNIPPETS_ROOT, { recursive: true, force: true });
  }

  // Recreate the directory
  fs.mkdirSync(SNIPPETS_ROOT, { recursive: true });
}

/**
 * Main function
 */
function main(): number {
  const verbose = process.argv.includes("--verbose");

  // Check for help flag
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: bun run scripts/generate-snippets [--verbose] [--help]");
    console.log("");
    console.log("Options:");
    console.log("  --verbose  Show more detailed output");
    console.log("  --help     Show this help message");
    return 0;
  }

  // Always clean the output directory first
  cleanOutputDirectory();

  // Find all extractable docs
  const paths = findMdxFilesRecursive(CONTENT_ROOT);

  if (paths.length === 0) {
    console.warn("No MDX documents found in content directory.");
    return 0; // Exit success, since there's nothing to do
  }

  console.log(`Found ${paths.length} MDX documents for snippet extraction.`);
  console.log("Generating snippets...");

  // Generate snippets for each doc
  let allSuccessful = true;
  for (const path of paths) {
    if (IGNORED_PATHS.some((ignoredPath) => path.includes(ignoredPath))) {
      if (verbose) {
        console.log(`Skipping ignored path: ${path}`);
      }
      continue;
    }
    const success = generateDocSnippets(path, verbose);
    allSuccessful = allSuccessful && success;
  }

  if (allSuccessful) {
    console.log("All snippets generated successfully.");
    return 0;
  } else {
    console.error("Some snippets failed to generate.");
    return 1;
  }
}

// Run the main function and exit with the appropriate code
process.exit(main());
