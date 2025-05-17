/**
 * Snippet extraction module.
 *
 * This module provides low-level functions for extracting code snippets from MDX files
 * and generating runnable Python examples.
 */

import * as fs from "fs";
import * as path from "path";
// Import from shared provider config
import { replaceProviderVariables } from "@/src/config/providers";

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

  // Match all Python code blocks but exclude python-no-extract blocks
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
  outputDir: string,
  index: number,
  heading: string,
  baseName: string = "example",
  sourceFilePath: string = ""
): string {
  // Replace provider variables using shared function
  const processedSnippet = replaceProviderVariables(snippet.code, "openai");

  // Ensure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create the output file name with index (provider is always OpenAI)
  const fileName = `${baseName}_${index + 1}.py`;
  const outputFile = path.join(outputDir, fileName);

  // Create the output file content
  // Convert absolute path to one relative to project root
  const projectRoot = process.cwd();
  const relativePath = sourceFilePath.startsWith(projectRoot)
    ? sourceFilePath.substring(projectRoot.length + 1) // +1 to remove the leading slash
    : sourceFilePath;

  const content = `# Example ${index + 1}: ${heading}
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
export function processFile(mdxFile: string): string[] {
  if (!fs.existsSync(mdxFile)) {
    console.error(`Error: File ${mdxFile} not found`);
    return [];
  }

  // Extract snippets and headings
  const snippets = extractSnippets(mdxFile);
  const headings = extractHeadings(mdxFile);

  if (snippets.length === 0) {
    return [];
  }

  // Get the base filename without extension
  const baseName = path.basename(mdxFile, path.extname(mdxFile));

  // Find the path relative to the content directory
  const contentDirPath = path.join(process.cwd(), "content"); // Assuming content is at the root
  let relativePath = path.relative(contentDirPath, path.dirname(mdxFile));

  // Handle case where the file isn't in the content directory
  if (relativePath.startsWith("..")) {
    console.warn(`Warning: File ${mdxFile} is not within the content directory`);
    // Fallback to just using the immediate parent directory
    relativePath = path.basename(path.dirname(mdxFile));
  }

  // Create the output directory with the full relative path structure preserved
  const outputDir = path.join(process.cwd(), ".extracted-snippets", relativePath, baseName);

  // Ensure the output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  // Generate a separate Python file for each snippet
  const generatedFiles: string[] = [];
  snippets.forEach((snippet, index) => {
    const file = generatePythonFile(snippet, outputDir, index, headings[index], baseName, mdxFile);
    generatedFiles.push(file);
  });

  return generatedFiles;
}
