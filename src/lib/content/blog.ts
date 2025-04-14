import { blogContentHandler } from "./handlers/blog-content-handler";
import { useContent } from "./hooks/useContent";
import type { BlogMeta } from "./content-types";
import type { ContentResult, Content } from "./hooks/useContent";

// Define a BlogContent type based on the Content interface
export type BlogContent = Content<BlogMeta>;

/**
 * Hook for loading and rendering a blog post
 */
export function useBlogPost(slug: string): ContentResult<BlogMeta> {
  return useContent<BlogMeta>(slug, blogContentHandler);
}

/**
 * Get a blog post by slug
 */
export function getBlogPost(slug: string) {
  return blogContentHandler.getDocument(slug);
}

/**
 * Get all blog posts
 */
export function getAllBlogPosts() {
  return blogContentHandler.getAllDocuments();
}

// Re-export blog types
export type { BlogMeta };
