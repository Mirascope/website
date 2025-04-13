import type { ContentType } from "./content-types";
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
 * Builds a file system path from a normalized path
 *
 * @param normalizedPath - The normalized path (e.g. mirascope/getting-started.mdx)
 * @param contentType - The type of content (doc, blog, policy)
 * @returns File system path (e.g. /src/docs/mirascope/getting-started.mdx)
 */
export function buildFilePath(normalizedPath: string, contentType: ContentType): string {
  switch (contentType) {
    case "doc":
      return `/src/docs/${normalizedPath}`;
    case "blog":
      return `/src/posts/${normalizedPath}`;
    case "policy":
      return `/src/policies/${normalizedPath}`;
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
 * Generates a file path based on environment and content type
 *
 * @param path - The URL or normalized path
 * @param contentType - The type of content
 * @returns Appropriate file path for the current environment
 */
export function getContentPath(path: string, contentType: ContentType): string {
  // Check if we're in production environment
  const isProduction = import.meta.env.PROD;

  // For production, use static JSON files
  if (isProduction) {
    const normalizedPath = normalizePath(path, contentType);

    switch (contentType) {
      case "doc":
        return `/static/docs/${normalizedPath.replace(/\\/g, "/")}.json`;
      case "blog":
        // For blog posts, remove the .mdx extension if present before adding .json
        // This matches what preprocess-content.ts produces
        return `/static/posts/${normalizedPath.replace(/\.mdx$/, "").replace(/\\/g, "/")}.json`;
      case "policy":
        // For policy files, remove the .mdx extension if present before adding .json
        // This matches what preprocess-content.ts produces
        return `/static/policies/${normalizedPath.replace(/\.mdx$/, "").replace(/\\/g, "/")}.json`;
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }
  }

  // For development environment, use the provided path
  // Different content types may have different APIs/endpoints
  switch (contentType) {
    case "policy":
      // Policy files need the /src/policies/ prefix in dev mode
      return `/src/policies/${normalizePath(path, contentType)}`;
    case "doc":
      // Docs need the src prefix in dev mode
      return `/src/docs/${normalizePath(path, contentType)}`;
    case "blog":
      // Blog posts need the /posts/ prefix in dev mode
      return `/posts/${normalizePath(path, contentType)}`;
    default:
      throw new Error(`Unsupported content type: ${contentType}`);
  }
}
