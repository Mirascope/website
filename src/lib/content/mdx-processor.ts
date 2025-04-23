import { parseFrontmatter } from "./frontmatter";
import { ContentError } from "./errors";
import type { ContentType } from "./content-types";

export interface ProcessedContent {
  content: string;
  frontmatter: Record<string, any>;
  code: string;
}

/**
 * Enhanced MDX processing that supports preprocessing and returns full content info
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
    preprocessContent?: (content: string) => string;
    path?: string; // Optional path for better error reporting
  }
): Promise<ProcessedContent> {
  if (!rawContent) {
    throw new ContentError("Empty content provided", contentType, options?.path);
  }

  try {
    // Extract frontmatter once
    const { frontmatter, content } = parseFrontmatter(rawContent);

    // Apply any preprocessing
    const processedContent = options?.preprocessContent
      ? options.preprocessContent(content)
      : content;

    // Dynamically import next-mdx-remote/serialize since it's an ESM module
    const { serialize } = await import("next-mdx-remote/serialize");
    const mdxSource = await serialize(processedContent, { scope: frontmatter });

    // Return complete processed content
    return {
      content: processedContent,
      frontmatter,
      code: mdxSource.compiledSource,
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
