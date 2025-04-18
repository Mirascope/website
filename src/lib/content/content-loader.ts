import type { ContentType } from "./types";
import { handleContentError } from "./errors";
import { resolveContentPath } from "./path-resolver";
import { environment } from "./environment";

export interface ContentLoaderOptions {
  devMode?: boolean;
}

/**
 * Fetches raw content from a given path
 *
 * @param contentPath - The path to fetch content from
 * @param devMode - Whether to process as development mode
 * @returns The raw content string
 */
export async function fetchRawContent(
  contentPath: string,
  devMode: boolean = environment.isDev()
): Promise<string> {
  try {
    // Fetch the content using the environment's fetch function
    const response = await environment.fetch(contentPath);

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

    // Fetch the content
    return await fetchRawContent(contentPath, devMode);
  } catch (error) {
    // Use the unified error handler
    handleContentError(error, contentType, path);
  }
}
