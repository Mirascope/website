import type { ContentLoaderOptions } from "./content-loader";
import { useContent } from "./useContent";
import { loadContent } from "./utils";
import type { ContentMeta, Content, ContentResult } from "./types";
import { ContentError } from "./errors";
import { environment } from "./environment";

// Define blog-specific metadata
export interface BlogMeta extends ContentMeta {
  date: string;
  author: string;
  readTime: string;
  lastUpdated?: string;
}

// Define blog-specific content type
export type BlogContent = Content<BlogMeta>;

/**
 * Create metadata from frontmatter for blog posts
 */
function createBlogMeta(frontmatter: Record<string, any>, path: string): BlogMeta {
  return {
    title: frontmatter.title || "",
    description: frontmatter.description || "",
    date: frontmatter.date || "",
    readTime: frontmatter.readTime || "",
    author: frontmatter.author || "Mirascope Team",
    slug: path,
    path: path,
    type: "blog",
    ...(frontmatter.lastUpdated && { lastUpdated: frontmatter.lastUpdated }),
  };
}

/**
 * Normalize a blog slug to ensure it has the proper prefix
 */
function normalizeBlogPath(slug: string): string {
  return slug.startsWith("/blog/") ? slug : `/blog/${slug}`;
}

/**
 * Get blog content by path
 */
export async function getBlogContent(
  slug: string,
  options?: ContentLoaderOptions
): Promise<BlogContent> {
  const normalizedSlug = normalizeBlogPath(slug);
  return loadContent<BlogMeta>(normalizedSlug, "blog", createBlogMeta, options);
}

/**
 * Hook for loading and rendering a blog post
 */
export function useBlogPost(slug: string): ContentResult<BlogMeta> {
  return useContent<BlogMeta>(slug, getBlogContent);
}

/**
 * Get all blog metadata
 */
export async function getAllBlogMeta(): Promise<BlogMeta[]> {
  try {
    // Choose implementation based on environment
    if (environment.isProd()) {
      // Production: Use pre-generated static JSON file
      const response = await fetch("/static/posts-list.json");
      if (!response.ok) {
        throw new Error(`Error fetching posts list: ${response.statusText}`);
      }
      return await response.json();
    } else {
      // Development: Use the virtual middleware endpoint
      const response = await fetch("/api/posts-list");
      if (!response.ok) {
        throw new Error(`Error fetching posts list: ${response.statusText}`);
      }
      return await response.json();
    }
  } catch (error) {
    console.error("Error fetching posts metadata:", error);
    throw new ContentError(
      `Failed to fetch posts metadata: ${error instanceof Error ? error.message : String(error)}`,
      "blog",
      undefined
    );
  }
}
