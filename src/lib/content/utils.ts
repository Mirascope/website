import { ContentCache } from "./content-cache";
import { ContentLoader } from "./content-loader";
import type { ContentType, ContentMeta, Content } from "./types";
import { parseFrontmatter } from "./frontmatter";
import { isValidPath } from "./path-resolver";
import { ContentError, DocumentNotFoundError, InvalidPathError, MetadataError } from "./errors";
import { validateMetadata } from "./metadata-service";
import { processMDX } from "./mdx-processor";

/**
 * Creates a cache key for content
 */
export function createCacheKey(contentType: ContentType, path: string): string {
  return `${contentType}:${path}`;
}

/**
 * Load content by path with caching
 */
export async function loadContent<T extends ContentMeta>(
  path: string,
  contentType: ContentType,
  loader: ContentLoader,
  cache: ContentCache,
  createMeta: (frontmatter: Record<string, any>, path: string) => T,
  postprocessContent?: (content: string) => string
): Promise<Content<T>> {
  try {
    // Check cache first if available
    const cacheKey = createCacheKey(contentType, path);
    const cached = cache.get(contentType, cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Validate the path
    if (!isValidPath(path, contentType)) {
      throw new InvalidPathError(contentType, path);
    }

    // Load the raw content
    const rawContent = await loader.loadContent(path, contentType);

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

    // Cache the result
    cache.set(contentType, cacheKey, JSON.stringify(result));

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
