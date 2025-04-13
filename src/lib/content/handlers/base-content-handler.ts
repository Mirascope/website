import type { ContentType, ContentMeta, ContentWithMeta } from "@/lib/content/content-types";
import type { ContentTypeHandler } from "@/lib/content/handlers/content-type-handler";
import { parseFrontmatter } from "@/lib/content/frontmatter";
import { isValidPath } from "@/lib/content/path-resolver";
import { extractMetadataFromFrontmatter, validateMetadata } from "@/lib/content/metadata-service";
import {
  ContentError,
  DocumentNotFoundError,
  InvalidPathError,
  MetadataError,
} from "@/lib/content/errors";
import { ContentLoader, createContentLoader } from "@/lib/content/content-loader";
import { ContentCache, createContentCache } from "@/lib/content/content-cache";

/**
 * Base handler for all content types
 * Implements common functionality shared by doc, blog, and policy handlers
 */
export abstract class BaseContentHandler<T extends ContentMeta> implements ContentTypeHandler<T> {
  protected loader: ContentLoader;
  protected cache: ContentCache;
  protected contentType: ContentType;
  protected isProduction = import.meta.env.PROD;

  /**
   * Creates a new BaseContentHandler
   *
   * @param contentType - The content type this handler manages
   * @param loader - Content loader instance
   * @param cache - Optional cache instance
   */
  constructor(contentType: ContentType, loader?: ContentLoader, cache?: ContentCache) {
    this.contentType = contentType;
    this.loader = loader || createContentLoader({ cache });
    this.cache = cache || createContentCache();
  }

  /**
   * Retrieves a document by path using shared logic
   * with hooks for content-type specific customizations
   */
  async getDocument(path: string): Promise<ContentWithMeta & { meta: T }> {
    try {
      // Check cache first if available
      const cacheKey = this.getCacheKey(path);
      if (this.cache) {
        const cached = this.cache.get(this.contentType, cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Normalize the path if needed
      const normalizedPath = this.normalizePath(path);

      // Validate the path
      if (!isValidPath(normalizedPath, this.contentType)) {
        throw new InvalidPathError(this.contentType, normalizedPath);
      }

      // Load the document content
      const rawContent = await this.loader.loadContent(normalizedPath, this.contentType);

      // Parse frontmatter
      const { frontmatter, content } = parseFrontmatter(rawContent);

      // Extract and create metadata
      extractMetadataFromFrontmatter(frontmatter, this.contentType, path);

      // Create the meta object (handled by subclasses)
      const meta = this.createMetaFromFrontmatter(frontmatter, path);

      // Validate the final metadata
      const validation = validateMetadata(meta, this.contentType);
      if (!validation.isValid) {
        throw new MetadataError(
          this.contentType,
          path,
          new Error(`Invalid metadata: ${validation.errors?.join(", ")}`)
        );
      }

      const result = { meta, content: this.processContent(content) };

      // Cache the result
      if (this.cache) {
        this.cache.set(this.contentType, cacheKey, JSON.stringify(result));
      }

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
      throw new ContentError(
        `Failed to get ${this.contentType} content: ${path}`,
        this.contentType,
        path
      );
    }
  }

  /**
   * Gets all documents of this content type
   * Subclasses must implement this method
   */
  abstract getAllDocuments(filter?: (meta: T) => boolean): Promise<T[]>;

  /**
   * Gets documents for a specific collection
   * Subclasses must implement this method
   */
  abstract getDocumentsForCollection(collection: string): Promise<T[]>;

  /**
   * Creates metadata from frontmatter
   * Subclasses must implement this to handle type-specific metadata
   */
  protected abstract createMetaFromFrontmatter(frontmatter: Record<string, any>, path: string): T;

  /**
   * Gets a cache key for the given path
   * Subclasses can override this for custom caching strategies
   */
  protected getCacheKey(path: string): string {
    return `${this.contentType}:${path}`;
  }

  /**
   * Normalizes a path before validation and loading
   * Subclasses can override this for custom path handling
   */
  protected normalizePath(path: string): string {
    return path;
  }

  /**
   * Processes content after frontmatter parsing
   * Subclasses can override this for custom content processing
   */
  protected processContent(content: string): string {
    return content;
  }

  /**
   * Invalidates cache entries for this content type
   */
  protected invalidateCache(): void {
    this.cache.invalidate(this.contentType);
  }
}
