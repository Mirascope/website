import { readFileSync } from "fs";
import { join, resolve } from "path";
import { ContentError } from "./content";
import { parseFrontmatter } from "./mdx-processing";

/**
 * Options for MDX preprocessing
 */
export interface PreprocessMdxOptions {
  basePath: string; // Base path to resolve @/ file paths
  filePath?: string; // Current file path for error reporting
}

/**
 * Result of MDX preprocessing with code examples resolved
 */
export interface PreprocessedMdxResult {
  frontmatter: Record<string, any>;
  content: string; // Body content only (no frontmatter)
  fullContent: string; // Full file content with frontmatter
}

/**
 * Processes CodeExample directives in MDX content by replacing them with actual code blocks
 *
 * @param content - MDX content that may contain <CodeExample /> directives
 * @param basePath - Base path to resolve @/ file paths
 * @param filePath - Current file path for error reporting
 * @returns Content with CodeExample directives replaced by actual code blocks
 * @throws ContentError if referenced files don't exist or can't be read
 */
function processCodeExamples(content: string, basePath: string, filePath?: string): string {
  // Regex to match <CodeExample file="..." /> with optional lines, lang, and highlight attributes
  const codeExampleRegex =
    /<CodeExample\s+file="([^"]+)"(?:\s+lines="([^"]+)")?(?:\s+lang="([^"]+)")?(?:\s+highlight="([^"]+)")?\s*\/>/g;

  return content.replace(
    codeExampleRegex,
    (_, file: string, lines?: string, lang?: string, highlight?: string) => {
      try {
        // Resolve @/ paths relative to basePath
        const resolvedPath = file.startsWith("@/")
          ? join(basePath, file.slice(2))
          : resolve(basePath, file);

        // Read the file
        const fileContent = readFileSync(resolvedPath, "utf-8");

        // Process lines if specified (e.g., "1-5" or "10-20")
        let processedContent = fileContent;
        if (lines) {
          const [start, end] = lines.split("-").map((n) => parseInt(n.trim(), 10));
          if (!isNaN(start) && !isNaN(end)) {
            const fileLines = fileContent.split("\n");
            // Convert to 0-based indexing and slice
            processedContent = fileLines.slice(start - 1, end).join("\n");
          }
        }

        // Infer language from file extension if not provided
        const inferredLang = lang || inferLanguageFromPath(resolvedPath);

        // Add highlight metadata if provided
        const metaInfo = highlight ? ` {${highlight}}` : "";

        // Return as a code block with optional highlighting
        return `\`\`\`${inferredLang}${metaInfo}\n${processedContent}\n\`\`\``;
      } catch (error) {
        throw new ContentError(
          `Error processing CodeExample: ${error instanceof Error ? error.message : String(error)}`,
          "docs",
          filePath,
          error instanceof Error ? error : undefined
        );
      }
    }
  );
}

/**
 * Infers programming language from file path
 */
function inferLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (!ext) return "text";

  const langMap: Record<string, string> = {
    py: "python",
    js: "javascript",
    ts: "typescript",
    jsx: "jsx",
    tsx: "tsx",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    sql: "sql",
    css: "css",
    html: "html",
    xml: "xml",
    toml: "toml",
    rs: "rust",
    go: "go",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
  };

  return langMap[ext] || "text";
}

/**
 * Preprocesses MDX content by resolving CodeExample directives and parsing frontmatter
 *
 * @param rawContent - Raw MDX content with frontmatter and potential CodeExample directives
 * @param options - Options for preprocessing
 * @returns Preprocessed content with CodeExample directives resolved
 * @throws ContentError if referenced files don't exist
 */
export function preprocessMdx(
  rawContent: string,
  options: PreprocessMdxOptions
): PreprocessedMdxResult {
  // First process code examples in the raw content (before frontmatter parsing)
  const contentWithCodeExamples = processCodeExamples(
    rawContent,
    options.basePath,
    options.filePath
  );

  // Parse frontmatter from the processed content
  const { frontmatter, content } = parseFrontmatter(contentWithCodeExamples);

  return {
    frontmatter,
    content,
    fullContent: contentWithCodeExamples,
  };
}
