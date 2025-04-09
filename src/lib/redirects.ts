/**
 * Redirects configuration for the website
 *
 * This file defines redirects from old paths to new paths
 * and can be imported by the router to handle redirect routes.
 */

// Define exact redirects - maps old paths to new paths
export const exactRedirects: Record<string, string> = {
  // Documentation redirects
  "/WELCOME": "/docs/mirascope",
  "/WHY": "/docs/mirascope/getting-started/why",
  "/HELP": "/docs/mirascope/getting-started/help",
  "/MIGRATE": "/docs/mirascope/getting-started/migration",
  "/CONTRIBUTING": "/docs/mirascope/getting-started/contributing",
  "/learn": "/docs/mirascope/learn",

  // Legacy docs paths
  "/docs": "/docs/mirascope",
  "/docs/": "/docs/mirascope",
};

// Define pattern redirects - for patterns that need regex-like handling
export const patternRedirects: Array<{
  pattern: RegExp;
  replacement: string;
}> = [
  // Learn section with any depth of subpaths - handles learn/x, learn/x/y, etc.
  { pattern: /^\/learn\/(.+)$/, replacement: "/docs/mirascope/learn/$1" },

  // Old blog paths
  { pattern: /^\/post\/(.+)$/, replacement: "/blog/$1" },
];

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

  // No redirect found
  return null;
}
