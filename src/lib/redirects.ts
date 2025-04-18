/**
 * Redirects configuration for the website
 *
 * This file defines redirects from old paths to new paths
 * and can be imported by the router to handle redirect routes.
 *
 * Note: Static redirects have been moved to public/_redirects for Cloudflare Pages.
 * Only include redirects here that need dynamic processing or aren't covered by Cloudflare.
 */
import { isValidProduct } from "./route-types";

// Define exact redirects - maps old paths to new paths
export const exactRedirects: Record<string, string> = {
  // Legacy docs paths
  "/docs": "/docs/mirascope",
  "/docs/": "/docs/mirascope",
};

// Define pattern redirects - for patterns that need regex-like handling
export const patternRedirects: Array<{
  pattern: RegExp;
  replacement: string;
}> = [];

/**
 * Process a URL path through redirect rules
 * Returns the new path if a redirect is needed, or null if no redirect applies
 */
export function processRedirects(path: string): string | null {
  // Normalize path by removing trailing slash except for root path
  if (path !== "/" && path.endsWith("/")) {
    path = path.slice(0, -1);
  }

  // 1. Check exact redirects first
  if (exactRedirects[path]) {
    return exactRedirects[path];
  }

  // 2. Check pattern redirects
  for (const { pattern, replacement } of patternRedirects) {
    const match = path.match(pattern);
    if (match) {
      return path.replace(pattern, replacement);
    }
  }

  // 3. Special case: redirect /docs/{invalid-product} to /docs/mirascope
  const docsProductMatch = path.match(/^\/docs\/([^\/]+)(?:\/.*)?$/);
  if (docsProductMatch && !isValidProduct(docsProductMatch[1])) {
    return "/docs/mirascope";
  }

  // No redirect found
  return null;
}
