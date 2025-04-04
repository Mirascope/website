/**
 * Snippet extraction module.
 *
 * This module provides low-level functions for extracting code snippets from MDX files
 * and generating runnable Python examples for different providers.
 */

import * as fs from "fs";
import * as path from "path";
// Import from shared provider config
import { providerDefaults } from "../../src/config/providers";
import type { Provider } from "../../src/config/providers";

/**
 * Extract Python snippets from an MDX file
 */
export function extractSnippets(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");

  // Match all Python code blocks
  const regex = /```python\n([\s\S]*?)```/g;
  const snippets: string[] = [];

  let match;
  while ((match = regex.exec(content)) !== null) {
    snippets.push(match[1].trim());
  }

  return snippets;
}

/**
 * Extract heading above the code block
 */
export function extractHeadings(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");

  // Find code blocks
  const codeBlockRegex = /```python\n([\s\S]*?)```/g;
  const headings: string[] = [];

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Look for the closest heading before the match
    const contentBeforeMatch = content.substring(0, match.index);
    const headingRegex = /#{1,6}\s+(.+)$/gm;

    let lastHeading = "";
    let headingMatch;
    while ((headingMatch = headingRegex.exec(contentBeforeMatch)) !== null) {
      lastHeading = headingMatch[1].trim();
    }

    headings.push(lastHeading || "Example");
  }

  return headings;
}

/**
 * Replace provider-specific variables in a code string
 */
export function replaceProviderVariables(code: string, provider: string): string {
  // Convert provider to lowercase for case-insensitive matching
  const providerKey = provider.toLowerCase() as Provider;

  // Check if provider exists
  if (!providerDefaults[providerKey]) {
    console.error(`Error: Provider "${provider}" not found in defaults.`);
    console.error(`Available providers: ${Object.keys(providerDefaults).join(", ")}`);
    process.exit(1);
  }

  const info = providerDefaults[providerKey];

  // Replace variables in code
  return code.replace(/\$PROVIDER/g, providerKey).replace(/\$MODEL/g, info.defaultModel);
}

/**
 * Generate a runnable Python file for a single snippet
 */
export function generatePythonFile(
  snippet: string,
  provider: string,
  outputDir: string,
  index: number,
  heading: string,
  baseName: string = "example"
): string {
  // Replace provider variables
  const processedSnippet = replaceProviderVariables(snippet, provider);

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create the output file name with provider and index
  const fileName = `${baseName}_${provider}_${index + 1}.py`;
  const outputFile = path.join(outputDir, fileName);

  // Create the output file content
  const content = `#!/usr/bin/env python3
# Example ${index + 1}: ${heading}
# Generated for provider: ${provider}
# This file is auto-generated and should not be edited directly

${processedSnippet}
`;

  // Write the file
  fs.writeFileSync(outputFile, content);
  console.log(`Generated ${outputFile}`);

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

  console.log(`Found ${snippets.length} Python snippets in ${mdxFile}`);

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
    // Get the relative path part after src/docs/
    const relativePath = dirName.includes("src/docs/")
      ? dirName.split("src/docs/")[1]
      : path.basename(dirName);

    outputDir = path.join("public", "extracted-snippets", relativePath, baseName, provider);
  }

  // Generate a separate Python file for each snippet
  const generatedFiles: string[] = [];
  snippets.forEach((snippet, index) => {
    const file = generatePythonFile(snippet, provider, outputDir, index, headings[index], baseName);
    generatedFiles.push(file);
  });

  console.log(`Successfully generated ${snippets.length} example files in ${outputDir}`);
  return generatedFiles;
}
