// scripts/lib/router-utils.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type { PostMeta } from "./mdx";
import { getAllDocs } from "../docs/_meta";

// Base URL for the site
export const SITE_URL = "https://mirascope.com";

// Exclude these static routes as they auto-redirect to other pages
const ROUTES_TO_EXCLUDE = ["/docs/", "/terms/"];

// Patterns for hidden routes (not included in sitemap or SEO metadata)
export const EXCLUDE_DEV = /^\/dev\/.*/;
export const HIDDEN_ROUTE_PATTERNS = [EXCLUDE_DEV];

export function isHiddenRoute(route: string): boolean {
  return HIDDEN_ROUTE_PATTERNS.some((pattern) => pattern.test(route));
}

// Get the project root directory
export function getProjectRoot(): string {
  // Get the directory name for the current module
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  // Project root directory (2 levels up from src/lib)
  return path.join(__dirname, "..", "..");
}

// Get path to posts list json
export function getPostsListPath(): string {
  return path.join(getProjectRoot(), "public", "static", "posts-list.json");
}

/**
 * Extract static routes from TanStack Router's generated route tree file
 * This avoids having to duplicate route definitions
 */
export function getStaticRoutes(): string[] {
  // Read the routeTree.gen.ts file to extract routes
  const routeTreePath = path.join(getProjectRoot(), "src", "routeTree.gen.ts");
  const routeTreeContent = fs.readFileSync(routeTreePath, "utf-8");

  // Extract routes from the manifest section
  const manifestMatch = routeTreeContent.match(
    /ROUTE_MANIFEST_START\s*(\{[\s\S]*?\})\s*ROUTE_MANIFEST_END/
  );
  if (manifestMatch && manifestMatch[1]) {
    try {
      const manifest = JSON.parse(manifestMatch[1]);

      if (manifest.routes) {
        // Extract all routes from the manifest
        const routes = Object.keys(manifest.routes);

        // Filter out the root and dynamic routes
        return routes
          .filter(
            (route) =>
              route !== "__root__" &&
              !route.includes("$") &&
              !ROUTES_TO_EXCLUDE.some((exclude) => route == exclude)
          )
          .map((route) => {
            // Normalize trailing slashes to match real URLs
            if (route.endsWith("/") && route !== "/") {
              return route.slice(0, -1);
            }
            return route;
          })
          .sort();
      }
    } catch (error) {
      console.warn("Failed to parse route manifest, falling back to regex extraction");
    }
  }

  // Fallback to the previous regex approach if manifest extraction fails
  const staticRoutes: string[] = [];

  // Match all path entries in the FileRoutesByPath interface
  const pathRegex = /\s+'\/[^']*':\s+{/g;
  let match;

  while ((match = pathRegex.exec(routeTreeContent)) !== null) {
    // Extract and clean up the path
    let route = match[0].trim().split("'")[1];

    // Skip dynamic routes for static generation
    if (route.includes("$")) {
      continue;
    }

    // Normalize trailing slashes to match TanStack behavior
    // TanStack path: '/blog/' but actual URL is '/blog'
    if (route.endsWith("/") && route !== "/") {
      route = route.slice(0, -1);
    }

    staticRoutes.push(route);
  }

  return staticRoutes.sort();
}

/**
 * Get blog post routes from the posts list
 */
export async function getBlogRoutes(): Promise<string[]> {
  const postsListPath = getPostsListPath();
  if (!fs.existsSync(postsListPath)) {
    console.warn("Blog posts list not found at:", postsListPath);
    return [];
  }

  try {
    const postsList: PostMeta[] = JSON.parse(fs.readFileSync(postsListPath, "utf8"));
    return postsList.map((post) => `/blog/${post.slug}`).sort();
  } catch (error) {
    console.warn("Failed to load blog posts list:", error);
    return [];
  }
}

/**
 * Get doc routes
 */
export function getDocsRoutes(): string[] {
  const allDocs = getAllDocs();
  return allDocs
    .map((doc) => {
      if (doc.path === "index") {
        return `/docs/${doc.product}`;
      } else {
        return `/docs/${doc.product}/${doc.path}`;
      }
    })
    .sort();
}

/**
 * Get all routes (static + blogs + docs)
 */
export async function getAllRoutes(includeHidden = false): Promise<string[]> {
  const staticRoutes = getStaticRoutes();
  const blogRoutes = await getBlogRoutes();
  const docRoutes = getDocsRoutes();

  // Combine all routes and remove duplicates
  const allRoutes = [...staticRoutes, ...blogRoutes, ...docRoutes];
  return [...new Set(allRoutes)].filter((route) => includeHidden || !isHiddenRoute(route)).sort();
}

/**
 * Get posts with metadata
 */
export async function getBlogPostsWithMeta(): Promise<PostMeta[]> {
  const postsListPath = getPostsListPath();
  if (!fs.existsSync(postsListPath)) {
    console.warn("Blog posts list not found at:", postsListPath);
    return [];
  }

  try {
    return JSON.parse(fs.readFileSync(postsListPath, "utf8"));
  } catch (error) {
    console.warn("Failed to load blog posts list:", error);
    return [];
  }
}
