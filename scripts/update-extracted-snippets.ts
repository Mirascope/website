#!/usr/bin/env node

/**
 * Update or verify extracted code snippets from MDX documentation.
 *
 * This script manages the extraction of code snippets from MDX files
 * that are marked with hasExtractableSnippets in _meta.ts.
 *
 * Usage:
 *   npm run update-snippets                       # Update all extractable snippets
 *   npm run update-snippets -- --path=<file-path> # Update snippets for a specific file
 *   npm run update-snippets -- --check            # Check if all snippets are up-to-date
 *   npm run update-snippets -- --check --path=<file-path> # Check specific file
 *   npm run update-snippets -- --verbose          # Show more detailed output
 *
 * Exit codes:
 *   0: Success (or no extractable snippets found for given path)
 *   1: Error (snippets out of date or other error)
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// Import our low-level extraction functions
import { processFile } from "./extract-snippets";

// Import doc meta types and data
import { getAllDocs } from "../src/docs/_meta";

// Provider list to generate examples for
const PROVIDERS = ["openai", "anthropic"];

// Root directory for extracted snippets
const SNIPPETS_ROOT = path.join(process.cwd(), "public", "extracted-snippets");

// Docs root directory
const DOCS_ROOT = path.join(process.cwd(), "src", "docs");

/**
 * Interface for a document with extractable snippets
 */
interface ExtractableDoc {
  product: string;
  logicalPath: string;
  filePath: string;
}

/**
 * Find all docs marked with hasExtractableSnippets flag
 */
function findExtractableDocs(specificFilePath?: string): ExtractableDoc[] {
  const extractableDocs: ExtractableDoc[] = [];
  const absoluteTargetPath = specificFilePath ? path.resolve(specificFilePath) : null;

  // Get all docs from metadata
  const allDocs = getAllDocs();

  // Filter to only those marked as extractable
  for (const doc of allDocs) {
    if (doc.meta.hasExtractableSnippets) {
      // Convert logical path to file path
      let filePath: string;

      if (doc.path.includes("/index")) {
        filePath = path.join(DOCS_ROOT, doc.product, `${doc.path.replace("/index", "")}.mdx`);
      } else {
        filePath = path.join(DOCS_ROOT, doc.product, `${doc.path}.mdx`);
      }

      // Resolve to absolute path for comparison
      const absoluteFilePath = path.resolve(filePath);

      // If a specific file is requested, only include that one
      if (absoluteTargetPath && absoluteTargetPath !== absoluteFilePath) {
        continue;
      }

      if (fs.existsSync(filePath)) {
        extractableDocs.push({
          product: doc.product,
          logicalPath: doc.path,
          filePath,
        });
      } else if (!absoluteTargetPath) {
        // Only log this warning in full scan mode, not when targeting a specific file
        console.warn(`Warning: Doc marked as extractable but file not found: ${filePath}`);
      }
    } else if (absoluteTargetPath) {
      // Check if this is the specific target file but not marked extractable
      let filePath: string;

      if (doc.path.includes("/index")) {
        filePath = path.join(DOCS_ROOT, doc.product, `${doc.path.replace("/index", "")}.mdx`);
      } else {
        filePath = path.join(DOCS_ROOT, doc.product, `${doc.path}.mdx`);
      }

      const absoluteFilePath = path.resolve(filePath);

      if (absoluteTargetPath === absoluteFilePath) {
        // We found the target file but it's not marked as extractable
        console.log(`Info: ${filePath} is not marked as extractable in _meta.ts`);
      }
    }
  }

  return extractableDocs;
}

/**
 * Helper function to compare two directories of extracted snippets
 * @returns An array of filenames that differ between the two directories
 */
function compareDirectories(dir1: string, dir2: string): string[] {
  const differentFiles: string[] = [];

  // Check that both directories exist
  if (!fs.existsSync(dir1) || !fs.existsSync(dir2)) {
    throw new Error(`One or both directories don't exist: ${dir1}, ${dir2}`);
  }

  // Get all Python files in the first directory
  const files1 = fs
    .readdirSync(dir1)
    .filter((file) => file.endsWith(".py"))
    .sort();

  // Get all Python files in the second directory
  const files2 = fs
    .readdirSync(dir2)
    .filter((file) => file.endsWith(".py"))
    .sort();

  // Check if the number of files matches
  if (files1.length !== files2.length) {
    // Add any files that exist in one directory but not the other
    const allFiles = new Set([...files1, ...files2]);
    allFiles.forEach((file) => {
      if (!files1.includes(file) || !files2.includes(file)) {
        differentFiles.push(file);
      }
    });
    return differentFiles;
  }

  // Compare the content of each file
  for (let i = 0; i < files1.length; i++) {
    const fileName = files1[i];
    if (fileName !== files2[i]) {
      differentFiles.push(fileName);
      continue;
    }

    const content1 = fs.readFileSync(path.join(dir1, fileName), "utf8");
    const content2 = fs.readFileSync(path.join(dir2, fileName), "utf8");

    // Hash the contents to compare them
    const hash1 = crypto.createHash("md5").update(content1).digest("hex");
    const hash2 = crypto.createHash("md5").update(content2).digest("hex");

    if (hash1 !== hash2) {
      differentFiles.push(fileName);
    }
  }

  return differentFiles;
}

/**
 * Clean extracted snippets for a specific doc
 */
function cleanSnippets(doc: ExtractableDoc): void {
  const relativePath = doc.logicalPath.replace(/\/index$/, "");
  const snippetDir = path.join(SNIPPETS_ROOT, doc.product, relativePath);

  if (fs.existsSync(snippetDir)) {
    console.log(`Cleaning snippets for ${doc.filePath}...`);

    // Remove the directory recursively
    fs.rmSync(snippetDir, { recursive: true, force: true });
  }

  // Ensure the snippets root exists
  const parentDir = path.dirname(snippetDir);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }
}

/**
 * Update snippets for a single doc with specified providers
 */
function updateDocSnippets(doc: ExtractableDoc, providers: string[], verbose = false): boolean {
  let allSuccessful = true;

  // First clean existing snippets for this doc
  cleanSnippets(doc);

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
        `Error updating snippets for ${doc.filePath} with provider ${provider}:`,
        error
      );
      allSuccessful = false;
    }
  }

  return allSuccessful;
}

/**
 * Check if snippets for a doc are up-to-date
 */
function checkDocSnippets(doc: ExtractableDoc, providers: string[], verbose = false): boolean {
  let allUpToDate = true;

  // Create a shared temp directory
  const tempDir = path.join(process.cwd(), ".temp-snippet-check");

  try {
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    for (const provider of providers) {
      try {
        // Clean the temp directory first
        if (fs.existsSync(tempDir)) {
          fs.readdirSync(tempDir).forEach((file) => {
            fs.unlinkSync(path.join(tempDir, file));
          });
        }

        // Get existing snippets paths
        const relativePath = doc.logicalPath.replace(/\/index$/, "");
        const snippetDir = path.join(SNIPPETS_ROOT, doc.product, relativePath, provider);

        if (!fs.existsSync(snippetDir)) {
          console.error(`Snippets not found for ${doc.filePath} with provider ${provider}`);
          allUpToDate = false;
          continue;
        }

        // Extract snippets from MDX file to temporary directory
        const tempFiles = processFile(doc.filePath, provider, tempDir);

        if (tempFiles.length === 0) {
          console.warn(
            `Warning: No snippets extracted from ${doc.filePath} for provider ${provider}`
          );
          continue;
        }

        // Compare the existing and newly generated snippets
        try {
          const differentFiles = compareDirectories(snippetDir, tempDir);

          if (differentFiles.length > 0) {
            console.error(
              `Snippets out of date for ${doc.filePath} with provider ${provider}. Files: ${differentFiles.join(", ")}`
            );
            allUpToDate = false;
          } else if (verbose) {
            console.log(`Snippets up to date for ${doc.filePath} with provider ${provider}`);
          }
        } catch (error) {
          console.error(
            `Error comparing snippets for ${doc.filePath} with provider ${provider}:`,
            error
          );
          allUpToDate = false;
        }
      } catch (error) {
        console.error(
          `Error checking snippets for ${doc.filePath} with provider ${provider}:`,
          error
        );
        allUpToDate = false;
      }
    }
  } finally {
    // Always clean up temp directory, even if there were errors
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  return allUpToDate;
}

/**
 * Parse command line arguments
 */
function parseArgs(): { check: boolean; path?: string; verbose: boolean } {
  const args = process.argv.slice(2);
  const result = {
    check: args.includes("--check"),
    verbose: args.includes("--verbose"),
    path: undefined as string | undefined,
  };

  // Parse --path=<value> argument
  const pathArg = args.find((arg) => arg.startsWith("--path="));
  if (pathArg) {
    result.path = pathArg.substring("--path=".length);
  }

  return result;
}

/**
 * Main function
 */
function main(): number {
  const args = parseArgs();

  // Create snippets root directory if it doesn't exist
  if (!fs.existsSync(SNIPPETS_ROOT)) {
    fs.mkdirSync(SNIPPETS_ROOT, { recursive: true });
  }

  // Find extractable docs (filtered by path if provided)
  const docs = findExtractableDocs(args.path);

  if (docs.length === 0) {
    if (args.path) {
      console.log(`No extractable snippets found for ${args.path}`);
    } else {
      console.warn("No documents marked with hasExtractableSnippets flag found.");
    }
    return 0; // Exit success, since there's nothing to do
  }

  if (args.verbose) {
    console.log(`Found ${docs.length} docs with extractable snippets.`);
  }

  if (args.check) {
    console.log("Checking if snippets are up-to-date...");

    // Check snippets for each doc
    let allUpToDate = true;
    for (const doc of docs) {
      const upToDate = checkDocSnippets(doc, PROVIDERS, args.verbose);
      allUpToDate = allUpToDate && upToDate;
    }

    if (allUpToDate) {
      console.log("All snippets are up-to-date.");
      return 0;
    } else {
      console.error("Some snippets are out of date. Run npm run update-snippets to update them.");
      return 1;
    }
  } else {
    console.log("Updating extractable snippets...");

    // Update snippets for each doc
    let allSuccessful = true;
    for (const doc of docs) {
      const success = updateDocSnippets(doc, PROVIDERS, args.verbose);
      allSuccessful = allSuccessful && success;
    }

    if (allSuccessful) {
      console.log("All snippets updated successfully.");
      return 0;
    } else {
      console.error("Some snippets failed to update.");
      return 1;
    }
  }
}

// Run the main function and exit with the appropriate code
process.exit(main());
