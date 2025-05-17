#!/usr/bin/env bun

/**
 * Generate Python code snippets from MDX documentation.
 *
 * This script extracts executable Python code snippets from MDX files
 * that are marked with hasExtractableSnippets in _meta.ts.
 *
 * It always:
 * - Cleans the output directory
 * - Extracts all snippets from marked docs
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

// Import doc meta types and data
import { getAllDocInfo } from "@/src/lib/content";

// Provider list to generate examples for
const PROVIDERS = ["openai", "anthropic"];

// Root directory for extracted snippets (changed to .extracted-snippets)
const SNIPPETS_ROOT = path.join(process.cwd(), ".extracted-snippets");

// Docs root directory
const CONTENT_ROOT = path.join(process.cwd(), "content");

/**
 * Interface for a document with extractable snippets
 */
interface ExtractableDoc {
  logicalPath: string;
  filePath: string;
}

/**
 * Find all docs marked with hasExtractableSnippets flag
 */
function findExtractableDocs(): ExtractableDoc[] {
  const extractableDocs: ExtractableDoc[] = [];

  // Get all docs from metadata
  const allDocs = getAllDocInfo();

  // Filter to only those marked as extractable
  for (const doc of allDocs) {
    if (doc.hasExtractableSnippets) {
      // Construct the file path from the document path
      const filePath = path.join(CONTENT_ROOT, "docs", `${doc.path}.mdx`);

      if (fs.existsSync(filePath)) {
        // Extract the logical path from path
        // This is the path without the leading /content/docs/ and trailing .mdx
        const logicalPath = doc.path;
        extractableDocs.push({
          logicalPath,
          filePath,
        });
      } else {
        console.warn(`Warning: Doc marked as extractable but file not found: ${filePath}`);
      }
    }
  }

  return extractableDocs;
}

/**
 * Generate snippets for a single doc with specified providers
 */
function generateDocSnippets(doc: ExtractableDoc, providers: string[], verbose = false): boolean {
  let allSuccessful = true;

  for (const provider of providers) {
    try {
      // Extract new snippets
      const files = processFile(doc.filePath, provider);

      if (files.length > 0) {
        if (verbose) {
          console.log(
            `Generated ${files.length} snippets for ${doc.filePath} with provider ${provider}`
          );
        }
      } else {
        console.warn(
          `Warning: No snippets extracted from ${doc.filePath} for provider ${provider}`
        );
        allSuccessful = false;
      }
    } catch (error) {
      console.error(
        `Error generating snippets for ${doc.filePath} with provider ${provider}:`,
        error
      );
      allSuccessful = false;
    }
  }

  return allSuccessful;
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
  const docs = findExtractableDocs();

  if (docs.length === 0) {
    console.warn("No documents marked with hasExtractableSnippets flag found.");
    return 0; // Exit success, since there's nothing to do
  }

  console.log(`Found ${docs.length} docs with extractable snippets.`);
  console.log("Generating snippets...");

  // Generate snippets for each doc
  let allSuccessful = true;
  for (const doc of docs) {
    const success = generateDocSnippets(doc, PROVIDERS, verbose);
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
