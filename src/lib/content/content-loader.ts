import type { ContentType } from "./content-types";
import { ContentCache } from "./content-cache";
import { ContentLoadError, DocumentNotFoundError } from "./errors";
import { normalizePath, getContentPath } from "./path-resolver";

export interface ContentLoaderOptions {
  cache?: ContentCache;
  devMode?: boolean;
}

/**
 * Unified content loader that handles loading content from different sources
 * based on environment for all content types (docs, blog posts, policies).
 */
export class ContentLoader {
  private cache: ContentCache | null;
  private devMode: boolean;

  constructor(options?: ContentLoaderOptions) {
    this.cache = options?.cache || null;
    this.devMode = options?.devMode ?? import.meta.env.DEV;
  }

  /**
   * Loads content for the given path and content type
   *
   * @param path - The path to the content (e.g., "/docs/mirascope/getting-started")
   * @param contentType - The type of content ("doc", "blog", "policy")
   * @returns Promise that resolves to the content string
   */
  async loadContent(path: string, contentType: ContentType): Promise<string> {
    // Normalize the path based on content type
    const normalizedPath = normalizePath(path, contentType);

    // Check if we have a cached version
    if (this.cache) {
      const cached = this.cache.get(contentType, normalizedPath);
      if (cached) {
        return cached;
      }
    }

    try {
      // Load content based on environment
      const content = await this.fetchContent(path, normalizedPath, contentType);

      // Cache the content if we have a cache
      if (this.cache) {
        this.cache.set(contentType, normalizedPath, content);
      }

      return content;
    } catch (error) {
      if (error instanceof DocumentNotFoundError) {
        throw error;
      }

      // Wrap other errors in ContentLoadError
      throw new ContentLoadError(
        contentType,
        normalizedPath,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Fetches content from the appropriate source based on environment
   */
  private async fetchContent(
    originalPath: string,
    normalizedPath: string,
    contentType: ContentType
  ): Promise<string> {
    // Get the appropriate path based on environment and content type
    const contentPath = getContentPath(originalPath, contentType);

    try {
      // Fetch the content
      const response = await fetch(contentPath);

      if (!response.ok) {
        if (response.status === 404) {
          throw new DocumentNotFoundError(contentType, normalizedPath);
        }
        throw new Error(`Failed to fetch content: ${response.statusText}`);
      }

      // In production, content is stored as JSON with a content field
      if (this.devMode) {
        // In development, we get the raw content
        return await response.text();
      } else {
        // In production, all content types are stored as JSON with a content field
        const data = await response.json();
        return data.content;
      }
    } catch (error) {
      // Check for 404 errors in the message
      if (
        error instanceof Error &&
        (error.message.includes("404") || error.message.includes("not found"))
      ) {
        throw new DocumentNotFoundError(contentType, normalizedPath);
      }

      throw error;
    }
  }
}

/**
 * Factory function to create a ContentLoader
 */
export function createContentLoader(options?: ContentLoaderOptions): ContentLoader {
  return new ContentLoader(options);
}
