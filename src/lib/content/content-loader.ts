import { environment } from "./environment";
import type { ContentType, ContentMeta, Content } from "./content-types";
import { processMDXContent } from "./mdx-processor";
import { resolveContentPath } from "./path-resolver";
import { handleContentError } from "./errors";

/**
 * Fetches raw content from a given path
 *
 * @param contentPath - The path to fetch content from
 * @returns The raw content string
 */
export async function fetchRawContent(contentPath: string): Promise<string> {
  try {
    // Fetch the content using the environment's fetch function
    const response = await environment.fetch(contentPath);

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
    }

    // Now all content types are stored as JSON with a content field
    // since we preprocess content in both dev and prod
    const data = await response.json();
    return data.content;
  } catch (error) {
    throw error; // Let the caller handle the error with proper context
  }
}

/**
 * Unified content loading pipeline that handles the entire process
 * from path resolution to MDX processing and metadata creation
 */
export async function loadContent<T extends ContentMeta>(
  path: string,
  contentType: ContentType,
  createMeta: (frontmatter: Record<string, any>, path: string) => T,
  options?: {
    preprocessContent?: (content: string) => string;
  }
): Promise<Content<T>> {
  try {
    // Get content path
    const contentPath = resolveContentPath(path);

    // Use fetch to get raw content
    const rawContent = await fetchRawContent(contentPath);

    // Process MDX with preprocessing if needed
    const processed = await processMDXContent(rawContent, contentType, {
      preprocessContent: options?.preprocessContent,
      path: path,
    });

    // Create metadata
    const meta = createMeta(processed.frontmatter, path);

    // Return complete content
    return {
      meta,
      content: processed.content,
      mdx: {
        code: processed.code,
        frontmatter: processed.frontmatter,
      },
    };
  } catch (error) {
    return handleContentError(error, contentType, path);
  }
}
