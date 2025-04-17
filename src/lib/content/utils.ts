import type { ContentType, ContentMeta, Content } from "./types";
import { parseFrontmatter } from "./frontmatter";
import { isValidPath } from "./path-resolver";
import { ContentError, DocumentNotFoundError, InvalidPathError, MetadataError } from "./errors";
import { validateMetadata } from "./metadata-service";
import { processMDX } from "./mdx-processor";
import { loadContent as loadRawContent } from "./content-loader";
import type { ContentLoaderOptions } from "./content-loader";

/**
 * Load content by path
 */
export async function loadContent<T extends ContentMeta>(
  path: string,
  contentType: ContentType,
  createMeta: (frontmatter: Record<string, any>, path: string) => T,
  options?: ContentLoaderOptions,
  postprocessContent?: (content: string) => string
): Promise<Content<T>> {
  try {
    // Validate the path
    if (!isValidPath(path, contentType)) {
      throw new InvalidPathError(contentType, path);
    }

    // Load the raw content
    const rawContent = await loadRawContent(path, contentType, options);

    // Parse frontmatter
    const { frontmatter, content } = parseFrontmatter(rawContent);

    // Create the meta object (using domain-specific function)
    const meta = createMeta(frontmatter, path);

    // Validate the metadata
    const validation = validateMetadata(meta, contentType);
    if (!validation.isValid) {
      throw new MetadataError(
        contentType,
        path,
        new Error(`Invalid metadata: ${validation.errors?.join(", ")}`)
      );
    }

    // Apply any pre-processing to the content before MDX processing
    // This is especially important for the policy handler that needs to remove source map URLs
    const preprocessedContent = postprocessContent ? postprocessContent(content) : content;

    // Process the MDX content (with preprocessed content)
    const processedMDX = await processMDX(preprocessedContent);

    // Create the result
    const result: Content<T> = {
      meta,
      content,
      mdx: {
        code: processedMDX.code,
        frontmatter,
      },
    };

    return result;
  } catch (error) {
    // Re-throw known errors
    if (
      error instanceof DocumentNotFoundError ||
      error instanceof InvalidPathError ||
      error instanceof MetadataError ||
      error instanceof ContentError
    ) {
      throw error;
    }

    // Wrap other errors
    throw new ContentError(`Failed to get ${contentType} content: ${path}`, contentType, path);
  }
}
