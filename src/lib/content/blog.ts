import { ContentLoader, createContentLoader } from "./content-loader";
import { ContentCache, createContentCache } from "./content-cache";
import { useContent } from "./useContent";
import { loadContent } from "./utils";
import type { ContentMeta, Content, ContentResult, GetContentFn, ContentHandler } from "./types";
import { ContentError } from "./errors";

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
 * Blog content handler implementation
 */
class BlogHandler implements ContentHandler<BlogMeta> {
  private loader: ContentLoader;
  private cache: ContentCache;
  private contentType: "blog" = "blog";
  private isProduction = import.meta.env.PROD;

  constructor(loader?: ContentLoader, cache?: ContentCache) {
    this.loader = loader || createContentLoader({ cache });
    this.cache = cache || createContentCache();
  }

  /**
   * Get blog content by path/slug
   */
  async getContent(slug: string): Promise<BlogContent> {
    // Normalize path to ensure it has the proper prefix
    const normalizedSlug = this.normalizePath(slug);

    return loadContent<BlogMeta>(
      normalizedSlug,
      this.contentType,
      this.loader,
      this.cache,
      this.createMeta
    );
  }

  /**
   * Get all blog metadata
   */
  async getAllMeta(): Promise<BlogMeta[]> {
    try {
      // Check cache first
      const cacheKey = "posts-list";
      const cached = this.cache.get(this.contentType, cacheKey);
      if (cached) {
        return JSON.parse(cached) as BlogMeta[];
      }

      // Load all posts (implementation depends on environment)
      const posts = await this.getPostsList();

      // Sort posts by date in descending order
      const sortedPosts = posts.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      // Cache the sorted posts
      this.cache.set(this.contentType, cacheKey, JSON.stringify(sortedPosts));

      return sortedPosts;
    } catch (error) {
      throw new ContentError(
        `Failed to get all blog posts: ${error instanceof Error ? error.message : String(error)}`,
        this.contentType,
        undefined
      );
    }
  }

  /**
   * Normalize a blog slug to ensure it has the proper prefix
   */
  private normalizePath(slug: string): string {
    return slug.startsWith("/blog/") ? slug : `/blog/${slug}`;
  }

  /**
   * Create metadata from frontmatter
   */
  private createMeta = (frontmatter: Record<string, any>, path: string): BlogMeta => {
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
  };

  /**
   * Helper method to get a list of all blog posts metadata
   */
  private async getPostsList(): Promise<BlogMeta[]> {
    // Check the cache first
    const postsListKey = "posts-raw-meta";
    const cachedPostsList = this.cache.get(this.contentType, postsListKey);

    if (cachedPostsList) {
      return JSON.parse(cachedPostsList);
    }

    try {
      // Choose implementation based on environment
      let posts: BlogMeta[];

      if (this.isProduction) {
        // Production: Use pre-generated static JSON file
        const response = await fetch("/static/posts-list.json");
        if (!response.ok) {
          throw new Error(`Error fetching posts list: ${response.statusText}`);
        }
        posts = await response.json();
      } else {
        // Development: Use the virtual middleware endpoint
        const response = await fetch("/api/posts-list");
        if (!response.ok) {
          throw new Error(`Error fetching posts list: ${response.statusText}`);
        }
        // In the old implementation this returned file names, but we need metadata
        // We'll assume the API now returns BlogMeta[] directly
        posts = await response.json();
      }

      // Cache the metadata
      this.cache.set(this.contentType, postsListKey, JSON.stringify(posts));
      return posts;
    } catch (error) {
      console.error("Error fetching posts metadata:", error);
      throw new ContentError(
        `Failed to fetch posts metadata: ${error instanceof Error ? error.message : String(error)}`,
        this.contentType,
        undefined
      );
    }
  }
}

// Create a singleton instance
const blogHandler = new BlogHandler();

/**
 * Function to get blog content by slug
 */
export const getBlogContent: GetContentFn<BlogMeta> = (slug: string): Promise<BlogContent> => {
  return blogHandler.getContent(slug);
};

/**
 * Hook for loading and rendering a blog post
 */
export function useBlogPost(slug: string): ContentResult<BlogMeta> {
  return useContent<BlogMeta>(slug, getBlogContent);
}

/**
 * Get all blog metadata
 */
export function getAllBlogMeta(): Promise<BlogMeta[]> {
  return blogHandler.getAllMeta();
}
