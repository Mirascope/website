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
 * Extract Python snippets from an MDX file
 */
export function extractSnippets(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");

  // First, check for any python-* blocks that aren't our supported types
  const pythonPrefixRegex = /```(python-[^`\n]+)\n/g;
  let prefixMatch;
  while ((prefixMatch = pythonPrefixRegex.exec(content)) !== null) {
    const blockType = prefixMatch[1];
    // Only allow python-snippet-concat and python-snippet-skip
    if (blockType !== "python-snippet-concat" && blockType !== "python-snippet-skip") {
      throw new Error(
        `Unsupported Python block type "${blockType}" in file ${filePath}. Only python, python-snippet-concat, and python-snippet-skip are allowed.`
      );
    }
  }

  // Match Python blocks (regular), python-snippet-concat blocks, and python-snippet-skip blocks
  const snippetRegex = /```(python|python-snippet-concat|python-snippet-skip)\n([\s\S]*?)```/g;
  const snippets: string[] = [];

  let lastSnippet: string | null = null;

  // Count lines up to each match
  let match;
  while ((match = snippetRegex.exec(content)) !== null) {
    const blockType = match[1];
    const codeContent = match[2].trim();

    if (blockType === "python-snippet-skip") {
      continue;
    }

    if (blockType === "python-snippet-concat" && lastSnippet) {
      // Append to the previous snippet
      lastSnippet += "\n\n" + codeContent;
    } else {
      // Create a new snippet
      lastSnippet = codeContent;
      snippets.push(lastSnippet);
    }
  }

  return snippets;
}

/**
 * Generate a runnable Python file for a single snippet
 */
export function generatePythonFile(
  snippet: string,
  outputDir: string,
  index: number,
  baseName: string = "example",
  sourceFilePath: string = ""
): string {
  // Replace provider variables using shared function
  const processedSnippet = replaceProviderVariables(snippet, "openai");

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

  const content = `# Example ${index + 1}
# Source: ${relativePath}
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
    const file = generatePythonFile(snippet, outputDir, index, baseName, mdxFile);
    generatedFiles.push(file);
  });

  return generatedFiles;
}
