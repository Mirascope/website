import { ContentError, type ContentType } from "./content";
import remarkGfm from "remark-gfm";
import { compile } from "@mdx-js/mdx";
import { rehypeCodeMeta } from "./rehype-code-meta";
import type { TOCItem } from "@/src/components/core/navigation/TableOfContents";

/**
 * Result of frontmatter parsing
 */
export interface FrontmatterResult {
  frontmatter: Record<string, any>;
  content: string;
}

/**
 * Result of MDX processing
 */
export interface ProcessedContent {
  content: string;
  frontmatter: Record<string, any>;
  code: string;
  tableOfContents: TOCItem[];
}

/**
 * Parses frontmatter from document content
 *
 * @param content - The document content with frontmatter
 * @returns An object containing the parsed frontmatter and the cleaned content
 */
export function parseFrontmatter(content: string): FrontmatterResult {
  try {
    // Check for content with frontmatter pattern
    if (!content.startsWith("---")) {
      return {
        frontmatter: {},
        content,
      };
    }

    const parts = content.split("---");

    // Handle case with empty frontmatter (---\n---)
    if (parts.length >= 3 && parts[1].trim() === "") {
      return {
        frontmatter: {},
        content: parts.slice(2).join("---").trimStart(),
      };
    }

    // Normal case with frontmatter content
    if (parts.length >= 3) {
      const frontmatterStr = parts[1].trim();
      const contentParts = parts.slice(2).join("---");
      const cleanContent = contentParts.trimStart();

      // Parse frontmatter into key-value pairs
      const frontmatter: Record<string, any> = {};

      // Split by lines and process each line
      frontmatterStr.split("\n").forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return; // Skip empty lines

        // Look for key: value format
        const colonIndex = trimmedLine.indexOf(":");
        if (colonIndex > 0) {
          const key = trimmedLine.slice(0, colonIndex).trim();
          const value = trimmedLine.slice(colonIndex + 1).trim();

          // Remove quotes if present
          frontmatter[key] = value.replace(/^["'](.*)["']$/, "$1");
        }
      });

      return {
        frontmatter,
        content: cleanContent,
      };
    }

    // If no proper frontmatter found, return original content
    return {
      frontmatter: {},
      content,
    };
  } catch (error) {
    // In case of parsing error, return the original content
    return {
      frontmatter: {},
      content,
    };
  }
}

/**
 * Merges frontmatter from different sources with optional overwriting
 *
 * @param target - The target frontmatter object
 * @param source - The source frontmatter object
 * @param overwrite - Whether to overwrite existing values (default: false)
 * @returns The merged frontmatter
 */
export function mergeFrontmatter(
  target: Record<string, any>,
  source: Record<string, any>,
  overwrite = false
): Record<string, any> {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    // Only add if the key doesn't exist or overwrite is true
    if (overwrite || !(key in result)) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Extract table of contents items from markdown content
 *
 * @param content - The markdown content to process
 * @returns Array of TOCItem objects
 */
export function extractTableOfContents(content: string): TOCItem[] {
  const headings: TOCItem[] = [];

  // Process content line by line
  const lines = content.split("\n");

  // Track state of being inside code blocks or component tags
  let inCodeBlock = false;
  let componentNestingLevel = 0;

  // Heading pattern to match
  const headingPattern = /^(#{1,6})\s+(.+?)(?:\s+\{#([a-zA-Z0-9_-]+)\})?$/;

  // ApiType component pattern to match
  const apiTypePattern = /<ApiType\s+type="([^"]+)"[^>]*?\/>/;

  // Use a simpler regex for opening and closing tags - this is much faster
  const openTagsSimpleRegex = /<[^/][^>]*>/g;
  const closeTagsRegex = /<\/[^>]+>/g;
  const selfClosingTagRegex = /<[^>]*\/>/g;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Fast check for code blocks
    if (trimmedLine.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip content inside code blocks
    if (inCodeBlock) {
      continue;
    }

    // Process component tags first - need to update nesting level before checking headings
    if (line.includes("<")) {
      // Handle self-closing tags first so they don't affect nesting level
      let processedLine = line;
      if (line.includes("/>")) {
        // Temporarily remove self-closing tags for tag counting
        const selfClosingMatches = line.match(selfClosingTagRegex) || [];
        for (const match of selfClosingMatches) {
          processedLine = processedLine.replace(match, "");
        }
      }

      // Count opening tags
      if (processedLine.includes("<") && !processedLine.includes("</")) {
        const openMatches = processedLine.match(openTagsSimpleRegex);
        if (openMatches) {
          componentNestingLevel += openMatches.length;
        }
      }

      // Count closing tags
      if (processedLine.includes("</")) {
        const closeMatches = processedLine.match(closeTagsRegex);
        if (closeMatches) {
          componentNestingLevel -= closeMatches.length;
        }
      }

      // Make sure nesting level doesn't go below 0
      componentNestingLevel = Math.max(0, componentNestingLevel);
    }

    // Now process headings if we're not inside a component
    if (componentNestingLevel === 0 && trimmedLine.startsWith("#")) {
      const match = trimmedLine.match(headingPattern);
      if (match) {
        const level = match[1].length;
        let text = match[2].trim();

        // Process ApiType components in headings
        if (text.includes("<ApiType")) {
          const apiTypeMatches = text.match(apiTypePattern);
          if (apiTypeMatches && apiTypeMatches[1]) {
            // Replace the matched ApiType component with the badge text
            text = text.replace(apiTypeMatches[0], `[${apiTypeMatches[1]}]`);
          }
        }

        // Use explicit ID if provided in the format {#id}
        let id = match[3];

        // If no explicit ID, generate one from the text
        if (!id) {
          // For ID generation, use text with ApiType components stripped
          let idText = text;
          if (text.includes("<ApiType")) {
            idText = text.replace(apiTypePattern, "").trim();
          }

          id = idText
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
        }

        headings.push({
          id,
          text,
          level,
        });
      }
    }
  }

  return headings;
}

/**
 * MDX processing that parses frontmatter and compiles MDX content
 *
 * @param rawContent - Raw content string with frontmatter
 * @param contentType - The type of content being processed
 * @param options - Additional processing options
 * @returns Processed content with frontmatter, content and compiled code
 * @throws ContentError if MDX processing fails
 */
export async function processMDXContent(
  rawContent: string,
  contentType: ContentType,
  options?: {
    path?: string; // Optional path for better error reporting
  }
): Promise<ProcessedContent> {
  if (!rawContent) {
    throw new ContentError("Empty content provided", contentType, options?.path);
  }

  try {
    // Extract frontmatter
    const { frontmatter, content } = parseFrontmatter(rawContent);

    // Extract table of contents
    const tableOfContents = extractTableOfContents(content);

    const compiledResult = await compile(content, {
      outputFormat: "function-body",
      providerImportSource: "@mdx-js/react",
      development: process.env.NODE_ENV !== "production",
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeCodeMeta],
    });

    // Return processed content
    return {
      content,
      frontmatter,
      code: String(compiledResult),
      tableOfContents,
    };
  } catch (error) {
    // Throw a ContentError instead of returning an error component
    throw new ContentError(
      `Error processing MDX content: ${error instanceof Error ? error.message : String(error)}`,
      contentType,
      options?.path,
      error instanceof Error ? error : undefined
    );
  }
}
