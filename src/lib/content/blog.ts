import { loadContent } from "./content-loader";
import type { BlogMeta, BlogContent } from "./content-types";
import { ContentError } from "./errors";
import { environment } from "./environment";

// Re-export type definitions
export type { BlogMeta, BlogContent };

/**
 * Normalize a blog slug to ensure it has the proper prefix
 */
function normalizeBlogPath(slug: string): string {
  return slug.startsWith("/blog/") ? slug : `/blog/${slug}`;
}

/**
 * Get blog content by path
 */
export async function getBlogContent(slug: string): Promise<BlogContent> {
  const normalizedSlug = normalizeBlogPath(slug);
  return loadContent<BlogMeta>(normalizedSlug, "blog");
}

/**
 * Get all blog metadata
 */
export async function getAllBlogMeta(): Promise<BlogMeta[]> {
  try {
    // Both development and production use the same static file now
    const response = await environment.fetch("/static/content-meta/blog/index.json");
    if (!response.ok) {
      throw new Error(`Error fetching blog metadata: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching posts metadata:", error);
    throw new ContentError(
      `Failed to fetch posts metadata: ${error instanceof Error ? error.message : String(error)}`,
      "blog",
      undefined
    );
  }
}
