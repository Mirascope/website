import type { ContentType } from "./types";
import { InvalidPathError } from "./errors";

/**
 * Normalizes a URL path to a file system path based on content type
 *
 * @param path - The URL path to normalize (e.g. /docs/mirascope/getting-started)
 * @param contentType - The type of content (doc, blog, policy)
 * @returns Normalized path (e.g. mirascope/getting-started.mdx)
 */
export function normalizePath(path: string, contentType: ContentType): string {
  // Handle root paths like /docs, /blog
  if (path === "/docs" || path === "/docs/" || path === "/blog" || path === "/blog/") {
    return "index.mdx";
  }

  // Remove the content type prefix from the path
  let normalizedPath = "";

  switch (contentType) {
    case "doc":
      normalizedPath = path.replace(/^\/docs\//, "");
      break;
    case "blog":
      normalizedPath = path.replace(/^\/blog\//, "");
      break;
    case "policy":
      // Policy paths are like /privacy or /terms/service
      normalizedPath = path.replace(/^\//, "");
      break;
  }

  // Handle trailing slashes to indicate directory/index files
  if (normalizedPath.endsWith("/")) {
    normalizedPath = `${normalizedPath}index.mdx`;
    return normalizedPath;
  }

  // Handle various path formats
  if (normalizedPath === "" || normalizedPath === "/") {
    // Root path
    normalizedPath = "index.mdx";
  } else if (normalizedPath.endsWith("/index")) {
    // Already has /index at the end
    normalizedPath = `${normalizedPath}.mdx`;
  } else if (normalizedPath.endsWith("/index.mdx")) {
    // Already properly formatted
    // No change needed
  } else if (normalizedPath === "index") {
    // Just 'index'
    normalizedPath = "index.mdx";
  } else if (normalizedPath.includes("/") && normalizedPath.split("/").pop() === "index") {
    // Paths like mirascope/index
    normalizedPath = `${normalizedPath}.mdx`;
  } else {
    // Normal path like mirascope/migration
    normalizedPath = `${normalizedPath}.mdx`;
  }

  return normalizedPath;
}

/**
 * Builds a file system path for content
 * With our preprocessing plugin, static files are always available in development and production
 */
function buildContentPath(normalizedPath: string, contentType: ContentType): string {
  switch (contentType) {
    case "doc":
      return `/static/docs/${normalizedPath.replace(/\\/g, "/")}.json`;
    case "blog":
      // For blog posts, remove the .mdx extension if present before adding .json
      return `/static/posts/${normalizedPath.replace(/\.mdx$/, "").replace(/\\/g, "/")}.json`;
    case "policy":
      return `/static/policies/${normalizedPath.replace(/\\/g, "/")}.json`;
    case "dev":
      return `/static/dev/${normalizedPath.replace(/\\/g, "/")}.json`;
    default:
      throw new Error(`Unsupported content type: ${contentType}`);
  }
}

/**
 * Validates that a path is well-formed for a content type
 *
 * @param path - The path to validate
 * @param contentType - The type of content
 * @returns True if the path is valid
 * @throws InvalidPathError if the path is invalid
 */
export function isValidPath(path: string, contentType: ContentType): boolean {
  if (!path) {
    throw new InvalidPathError(contentType, path);
  }

  // Basic validation based on content type
  switch (contentType) {
    case "doc":
      // Docs should start with /docs/ or be /docs
      return path === "/docs" || path.startsWith("/docs/");
    case "blog":
      // Blog posts should start with /blog/ or be /blog
      return path === "/blog" || path.startsWith("/blog/");
    case "policy":
      // Policies can be at root (like /privacy) or in subdirectories (like /terms/service)
      return path.startsWith("/");
    default:
      return false;
  }
}

/**
 * Resolves a content path based on type
 *
 * @param path - The URL path to resolve
 * @param contentType - The type of content
 * @returns Resolved path string
 */
export function resolveContentPath(path: string, contentType: ContentType): string {
  const normalizedPath = normalizePath(path, contentType);

  // With our preprocessing plugin, we only need one path resolution approach
  return buildContentPath(normalizedPath, contentType);
}
