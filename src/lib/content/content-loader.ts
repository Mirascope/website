import type { ContentType } from "./types";
import { handleContentError } from "./errors";
import { resolveContentPath } from "./path-resolver";
import { environment } from "./environment";

export interface ContentLoaderOptions {
  devMode?: boolean;
  customFetch?: any;
}

/**
 * Fetches raw content from a given path
 *
 * @param contentPath - The path to fetch content from
 * @param fetchFn - The fetch function to use
 * @param devMode - Whether to process as development mode
 * @returns The raw content string
 */
export async function fetchRawContent(
  contentPath: string,
  fetchFn: any = fetch,
  devMode: boolean = environment.isDev()
): Promise<string> {
  try {
    // Fetch the content using the provided or default fetch function
    const response = await fetchFn(contentPath);

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
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
    throw error; // Let the caller handle the error with proper context
  }
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
  try {
    // Determine if we're in dev mode
    const devMode = options?.devMode ?? environment.isDev();

    // Get the appropriate content path
    const contentPath = resolveContentPath(path, contentType, { devMode });

    // Use provided fetch function or default
    const fetchFn = options?.customFetch ?? fetch;

    // Fetch the content
    return await fetchRawContent(contentPath, fetchFn, devMode);
  } catch (error) {
    // Use the unified error handler
    handleContentError(error, contentType, path);
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
