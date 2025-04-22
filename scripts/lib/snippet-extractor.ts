/**
 * Snippet extraction module.
 *
 * This module provides low-level functions for extracting code snippets from MDX files
 * and generating runnable Python examples for different providers.
 */

import * as fs from "fs";
import * as path from "path";
// Import from shared provider config
import { replaceProviderVariables } from "../../src/config/providers";
import type { Provider } from "../../src/config/providers";

/**
 * Interface for snippet with line number information
 */
export interface Snippet {
  code: string;
  lineNumber: number;
}

/**
 * Extract Python snippets from an MDX file
 */
export function extractSnippets(filePath: string): Snippet[] {
  const content = fs.readFileSync(filePath, "utf-8");

  // Match all Python code blocks
  const regex = /```python\n([\s\S]*?)```/g;
  const snippets: Snippet[] = [];

  // Count lines up to each match
  let match;
  while ((match = regex.exec(content)) !== null) {
    // Calculate line number by counting newlines up to the match start
    const textBeforeMatch = content.substring(0, match.index);
    const lineNumber = (textBeforeMatch.match(/\n/g) || []).length + 1;

    snippets.push({
      code: match[1].trim(),
      lineNumber: lineNumber,
    });
  }

  return snippets;
}

/**
 * Extract heading above the code block
 */
export function extractHeadings(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const headings: string[] = [];

  // Find all code blocks (any language, not just Python)
  const allCodeBlocksRegex = /```(?:\w*)\n([\s\S]*?)```/g;
  const blockLocations: { start: number; end: number }[] = [];

  // Map all code block locations
  let codeBlockMatch;
  while ((codeBlockMatch = allCodeBlocksRegex.exec(content)) !== null) {
    blockLocations.push({
      start: codeBlockMatch.index,
      end: codeBlockMatch.index + codeBlockMatch[0].length,
    });
  }

  // Reset and find Python code blocks specifically
  const pythonCodeBlockRegex = /```python\n([\s\S]*?)```/g;
  let match;

  while ((match = pythonCodeBlockRegex.exec(content)) !== null) {
    // Look for the closest heading before the match
    const contentBeforeMatch = content.substring(0, match.index);
    const headingRegex = /#{1,6}\s+(.+)$/gm;

    let lastHeading = "";
    let headingMatch;

    while ((headingMatch = headingRegex.exec(contentBeforeMatch)) !== null) {
      // Check if this potential heading is inside any code block
      const headingPosition = headingMatch.index;
      const insideCodeBlock = blockLocations.some(
        (block) => headingPosition > block.start && headingPosition < block.end
      );

      // Only use this heading if it's not inside a code block
      if (!insideCodeBlock) {
        lastHeading = headingMatch[1].trim();
      }
    }

    headings.push(lastHeading || "Example");
  }

  return headings;
}

/**
 * Generate a runnable Python file for a single snippet
 */
export function generatePythonFile(
  snippet: Snippet,
  provider: string,
  outputDir: string,
  index: number,
  heading: string,
  baseName: string = "example",
  sourceFilePath: string = ""
): string {
  // Convert provider to lowercase for case-insensitive matching
  const providerKey = provider.toLowerCase() as Provider;

  // Replace provider variables using shared function
  const processedSnippet = replaceProviderVariables(snippet.code, providerKey);

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create the output file name with provider and index
  const fileName = `${baseName}_${provider}_${index + 1}.py`;
  const outputFile = path.join(outputDir, fileName);

  // Create the output file content
  // Convert absolute path to one relative to project root
  const projectRoot = process.cwd();
  const relativePath = sourceFilePath.startsWith(projectRoot)
    ? sourceFilePath.substring(projectRoot.length + 1) // +1 to remove the leading slash
    : sourceFilePath;

  const content = `#!/usr/bin/env python3
# Example ${index + 1}: ${heading}
# Generated for provider: ${provider}
# Source: ${relativePath}:${snippet.lineNumber}
# This file is auto-generated; any edits should be made in the source file

${processedSnippet}
`;

  // Write the file
  fs.writeFileSync(outputFile, content);

  return outputFile;
}

/**
 * Process a single MDX file for a given provider
 */
export function processFile(
  mdxFile: string,
  provider: string,
  customOutputDir: string | null = null
): string[] {
  if (!fs.existsSync(mdxFile)) {
    console.error(`Error: File ${mdxFile} not found`);
    return [];
  }

  // Extract snippets and headings
  const snippets = extractSnippets(mdxFile);
  const headings = extractHeadings(mdxFile);

  if (snippets.length === 0) {
    console.warn("No Python snippets found in the file.");
    return [];
  }

  // Determine output directory
  const baseName = path.basename(mdxFile, path.extname(mdxFile));
  const dirName = path.dirname(mdxFile);

  let outputDir;
  if (customOutputDir) {
    // Use custom output directory if provided
    outputDir = path.resolve(customOutputDir);
  } else {
    // Create examples under public/extracted-snippets directory to make them accessible
    // Structure: public/extracted-snippets/mirascope/getting-started/quickstart/openai/
    // Get the relative path part after content/doc/
    const relativePath = dirName.includes("content/doc/")
      ? dirName.split("content/doc/")[1]
      : path.basename(dirName);

    outputDir = path.join(
      process.cwd(),
      "public",
      "extracted-snippets",
      relativePath,
      baseName,
      provider
    );
  }

  // Generate a separate Python file for each snippet
  const generatedFiles: string[] = [];
  snippets.forEach((snippet, index) => {
    const file = generatePythonFile(
      snippet,
      provider,
      outputDir,
      index,
      headings[index],
      baseName,
      mdxFile
    );
    generatedFiles.push(file);
  });

  return generatedFiles;
}
