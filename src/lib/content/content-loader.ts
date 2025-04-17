import type { ContentType } from "./types";
import { ContentLoadError, DocumentNotFoundError } from "./errors";
import { normalizePath, getContentPath } from "./path-resolver";

export interface ContentLoaderOptions {
  devMode?: boolean;
  customFetch?: any;
}

/**
 * Loads content for the given path and content type
 *
 * @param path - The path to the content (e.g., "/docs/mirascope/getting-started")
 * @param contentType - The type of content ("doc", "blog", "policy")
 * @param options - Options for loading content
 * @returns Promise that resolves to the content string
 */
export async function loadContent(
  path: string,
  contentType: ContentType,
  options?: ContentLoaderOptions
): Promise<string> {
  // Normalize the path based on content type
  const normalizedPath = normalizePath(path, contentType);

  // Determine if we're in dev mode
  const devMode = options?.devMode ?? import.meta.env?.DEV ?? false;

  // Use provided fetch function or default
  const fetchFn = options?.customFetch ?? fetch;

  try {
    // Get the appropriate content path
    const contentPath = getContentPath(path, contentType);

    // Fetch the content using the provided or default fetch function
    const response = await fetchFn(contentPath);

    if (!response.ok) {
      if (response.status === 404) {
        throw new DocumentNotFoundError(contentType, normalizedPath);
      }
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }

    // Process response based on environment
    if (devMode) {
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

    // Wrap other errors in ContentLoadError
    throw new ContentLoadError(
      contentType,
      normalizedPath,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Factory function for backward compatibility
 * @deprecated Use the loadContent function directly instead
 */
export function createContentLoader(options?: ContentLoaderOptions): {
  loadContent: (path: string, contentType: ContentType) => Promise<string>;
} {
  return {
    loadContent: (path: string, contentType: ContentType) =>
      loadContent(path, contentType, options),
  };
}
