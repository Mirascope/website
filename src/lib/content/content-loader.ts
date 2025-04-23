import { environment } from "./environment";
import type { ContentType, ContentMeta, Content } from "./content-types";
import { processMDXContent } from "./mdx-processor";
import { resolveContentPath } from "./path-resolver";
import { handleContentError } from "./errors";

// Raw content fetching is now handled directly in loadContent

/**
 * Unified content loading pipeline that gets preprocessed content from JSON
 * and processes it for rendering
 */
export async function loadContent<T extends ContentMeta>(
  path: string,
  contentType: ContentType
): Promise<Content<T>> {
  try {
    // Get content path
    const contentPath = resolveContentPath(path);

    // Fetch content JSON file
    const response = await environment.fetch(contentPath);

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
    }

    // Get the JSON data containing meta and content
    const data = await response.json();

    // Raw content from JSON (includes frontmatter)
    const rawContent = data.content;

    // Process MDX for rendering
    const processed = await processMDXContent(rawContent, contentType, {
      path: path,
    });

    // Use the metadata from preprocessing - no need to recreate it
    const meta = data.meta as T;

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
