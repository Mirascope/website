/**
 * Maps a URL path to a content JSON file path
 * Automatically determines the content type from the path
 *
 * @param path - The URL path to resolve
 * @returns Resolved path to JSON content file
 */
export function resolveContentPath(path: string): string {
  if (!path) {
    throw new Error("Path cannot be empty");
  }

  if (path.startsWith("/")) {
    path = path.slice(1); // Remove leading slash
  }
  if (path.endsWith("/")) {
    path = `${path}index`;
  }

  // Return the full path to the content file
  return `/static/content/${path}.json`;
}
