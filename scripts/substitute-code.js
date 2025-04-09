#!/usr/bin/env node

/**
 * Code Block Substitution Tool
 * ============================
 *
 * This script replaces code block placeholders in MDX files with actual code from source files.
 * It scans MDX files for code blocks containing "From:" directives and substitutes them with
 * code from the referenced files.
 *
 * Usage:
 * ------
 * ```
 * node scripts/substitute-code.js <mdx-file-path> [--no-substitution]
 * ```
 *
 * Examples:
 * ---------
 * ```
 * # Replace code placeholders in an MDX file
 * node scripts/substitute-code.js src/docs/mirascope/learn/middleware.mdx
 *
 * # Replace placeholders without making provider substitutions
 * node scripts/substitute-code.js src/docs/mirascope/learn/provider-specific/openai.mdx --no-substitution
 * ```
 *
 * How it works:
 * -------------
 * 1. It finds code blocks in MDX files with "From:" directives that specify source files and line ranges
 * 2. It reads the source code from the specified files (in the scratch/ directory)
 * 3. If a line range is specified, it extracts only those lines
 * 4. By default, it substitutes "openai" with "$PROVIDER" and "gpt-4o-mini" with "$MODEL"
 *    (This can be disabled with the --no-substitution flag)
 * 5. It replaces the placeholder code block with the actual code
 *
 * Directive format:
 * ----------------
 * ```python
 * # From: path/to/file.py           # Use entire file
 * # From: path/to/file.py:10:20     # Use lines 10-20 only
 * ```
 *
 * Multiple directives can be combined in a single code block:
 *
 * ```python
 * # From: path/to/file.py:1:5       # First show lines 1-5
 * # From: path/to/file.py:20:30     # Then show lines 20-30
 * ```
 *
 * The --no-substitution flag:
 * --------------------------
 * For provider-specific guides, use the --no-substitution flag to preserve provider names
 * and model identifiers in the code.
 */

const fs = require("fs");
const path = require("path");

// Get the absolute path to the project root based on current working directory
const ROOT_DIR = process.cwd();

// Process command line arguments
const args = process.argv.slice(2);
const mdxFilePath = args[0];
const noSubstitution = args.includes("--no-substitution");

if (!mdxFilePath) {
  console.error("Please provide the path to an MDX file");
  process.exit(1);
}

if (noSubstitution) {
  console.log("Running in no-substitution mode - provider and model substitution disabled");
}

const fullMdxPath = path.resolve(ROOT_DIR, mdxFilePath);
console.log(`Looking for MDX file at: ${fullMdxPath}`);
if (!fs.existsSync(fullMdxPath)) {
  console.error(`File not found: ${fullMdxPath}`);
  process.exit(1);
}

// Read the MDX file
let mdxContent = fs.readFileSync(fullMdxPath, "utf8");

// Find all code blocks with From: directives
let mdxLines = mdxContent.split("\n");
let codeBlocks = [];
let inCodeBlock = false;
let currentBlock = null;

// First pass: identify all code blocks with From: directives
for (let i = 0; i < mdxLines.length; i++) {
  const line = mdxLines[i];

  // Check for start of code block
  if (line.startsWith("```python") && !inCodeBlock) {
    inCodeBlock = true;
    currentBlock = {
      startLine: i,
      language: line.startsWith("```python-no-extract") ? "python-no-extract" : "python",
      fromDirectives: [],
      endLine: -1,
    };
  }
  // Check for From: directive in code block
  else if (inCodeBlock && line.trim().startsWith("# From:")) {
    const match = line.match(/# From: ([^:]+)(?::(\d+):(\d+))?/);
    if (match) {
      currentBlock.fromDirectives.push({
        filePath: match[1],
        startLine: match[2] ? parseInt(match[2]) : null,
        endLine: match[3] ? parseInt(match[3]) : null,
      });
    }
  }
  // Check for end of code block
  else if (line.trim() === "```" && inCodeBlock) {
    inCodeBlock = false;
    currentBlock.endLine = i;

    // Only add blocks with From: directives
    if (currentBlock.fromDirectives.length > 0) {
      codeBlocks.push(currentBlock);
      console.log(
        `Found code block with ${currentBlock.fromDirectives.length} From: directives at lines ${currentBlock.startLine}-${currentBlock.endLine}`
      );
    }

    currentBlock = null;
  }
}

// Second pass: process each code block
// Process blocks in reverse order to avoid line number issues
codeBlocks.reverse().forEach((block) => {
  // Process each From: directive in the block
  let combinedCode = "";
  let atLeastOneProcessed = false;

  for (const directive of block.fromDirectives) {
    const { filePath, startLine, endLine } = directive;
    const sourceFilePath = path.join(ROOT_DIR, "scratch", filePath);
    console.log(`Looking for source file at: ${sourceFilePath}`);

    try {
      if (fs.existsSync(sourceFilePath)) {
        // Read the source file
        let sourceCode = fs.readFileSync(sourceFilePath, "utf8");

        // Extract specific lines if line range is provided
        if (startLine !== null && endLine !== null) {
          const lines = sourceCode.split("\n");
          // Convert to 0-indexed for array and extract the requested range
          sourceCode = lines.slice(startLine - 1, endLine).join("\n");
          console.log(`Extracted lines ${startLine}-${endLine} from ${filePath}`);
        }

        // Only perform substitution if not in no-substitution mode
        if (!noSubstitution) {
          sourceCode = sourceCode.replace(/openai/g, "$PROVIDER");
          sourceCode = sourceCode.replace(/gpt-4o-mini/g, "$MODEL");
        }

        // Add to combined code with a separator if not the first code block
        if (combinedCode) {
          combinedCode += "\n\n";
        }
        combinedCode += sourceCode;
        atLeastOneProcessed = true;
        console.log(`Processed: ${filePath}`);
      } else {
        console.warn(`Source file not found: ${sourceFilePath}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  }

  if (atLeastOneProcessed) {
    // Ensure there's a newline at the end of the combined code
    if (!combinedCode.endsWith("\n")) {
      combinedCode += "\n";
    }

    // Create the replacement code block
    const replacementLines = ["```" + block.language, combinedCode, "```"];

    // Replace the original block with the new content
    mdxLines.splice(
      block.startLine,
      block.endLine - block.startLine + 1,
      ...replacementLines.join("\n").split("\n")
    );

    console.log(`Replaced code block at lines ${block.startLine}-${block.endLine}`);
  }
});

// Join the lines back together and write the file
fs.writeFileSync(fullMdxPath, mdxLines.join("\n"));
console.log(`Updated: ${fullMdxPath}`);
