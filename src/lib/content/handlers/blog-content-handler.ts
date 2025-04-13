import type { ContentWithMeta, BlogMeta } from "@/lib/content/content-types";
import { ContentError } from "@/lib/content/errors";
import { ContentLoader } from "@/lib/content/content-loader";
import { ContentCache } from "@/lib/content/content-cache";
import { BaseContentHandler } from "./base-content-handler";

/**
 * Handler for blog content
 */
export class BlogContentHandler extends BaseContentHandler<BlogMeta> {
  /**
   * Creates a new BlogContentHandler
   *
   * @param loader - Content loader instance
   * @param cache - Optional cache instance
   */
  constructor(loader?: ContentLoader, cache?: ContentCache) {
    super("blog", loader, cache);
  }

  /**
   * Creates metadata from frontmatter
   */
  protected createMetaFromFrontmatter(frontmatter: Record<string, any>, path: string): BlogMeta {
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
   * Normalizes the path for blog posts
   */
  protected normalizePath(slug: string): string {
    // Add the /blog/ prefix if it's not already there
    return slug.startsWith("/blog/") ? slug : `/blog/${slug}`;
  }

  /**
   * Gets a cache key for blog posts
   */
  protected getCacheKey(slug: string): string {
    return `post:${slug}`;
  }

  /**
   * Gets all blog posts
   */
  async getAllDocuments(filter?: (meta: BlogMeta) => boolean): Promise<BlogMeta[]> {
    try {
      // Check cache first
      const cacheKey = "posts-list";
      if (this.cache) {
        const cached = this.cache.get(this.contentType, cacheKey);
        if (cached) {
          const posts = JSON.parse(cached) as BlogMeta[];
          return filter ? posts.filter(filter) : posts;
        }
      }

      // Load all posts
      const posts = await this.loadAllPosts();
      const postList = Object.values(posts).map((post) => post.meta);

      // Sort posts by date in descending order
      const sortedPosts = postList.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      // Cache the sorted posts
      if (this.cache) {
        this.cache.set(this.contentType, cacheKey, JSON.stringify(sortedPosts));
      }

      // Apply filter if provided
      return filter ? sortedPosts.filter(filter) : sortedPosts;
    } catch (error) {
      throw new ContentError(
        `Failed to get all blog posts: ${error instanceof Error ? error.message : String(error)}`,
        this.contentType,
        undefined
      );
    }
  }

  /**
   * Gets blog posts with a specific collection
   *
   * Note: Currently, the blog doesn't support collections.
   * This method is implemented to satisfy the ContentTypeHandler interface.
   * When collections are added in the future, update this implementation.
   */
  async getDocumentsForCollection(collection: string): Promise<BlogMeta[]> {
    console.log(`[BlogContentHandler] getDocumentsForCollection called with: ${collection}`);

    // Currently no collection support - return empty array
    // This preserves the interface while allowing for future implementation
    return [];
  }

  /**
   * Helper method to get a list of all blog post files
   */
  private async getPostsList(): Promise<string[]> {
    // Check the cache first
    const postsListFilesKey = "posts-list-files";
    const cachedPostsFiles = this.cache.get(this.contentType, postsListFilesKey);

    if (cachedPostsFiles) {
      return JSON.parse(cachedPostsFiles);
    }

    try {
      // Choose implementation based on environment
      let postFiles: string[];

      if (this.isProduction) {
        // Production: Use pre-generated static JSON file matching what preprocess-content.ts generates
        const response = await fetch("/static/posts-list.json");
        if (!response.ok) {
          throw new Error(`Error fetching posts list: ${response.statusText}`);
        }
        // Get the list of posts metadata and extract the slugs to get filenames
        const posts = (await response.json()) as BlogMeta[];
        postFiles = posts.map((post) => `${post.slug}.mdx`);
      } else {
        // Development: Use the virtual middleware endpoint
        const response = await fetch("/api/posts-list");
        if (!response.ok) {
          throw new Error(`Error fetching posts list: ${response.statusText}`);
        }
        postFiles = await response.json();
      }

      // Cache the list
      this.cache.set(this.contentType, postsListFilesKey, JSON.stringify(postFiles));
      return postFiles;
    } catch (error) {
      console.error("Error fetching posts list:", error);
      throw new ContentError(
        `Failed to fetch posts list: ${error instanceof Error ? error.message : String(error)}`,
        this.contentType,
        undefined
      );
    }
  }

  /**
   * Load all posts with their content and metadata
   */
  private async loadAllPosts(): Promise<Record<string, ContentWithMeta & { meta: BlogMeta }>> {
    // Create a key for the entire posts collection
    const allPostsCacheKey = "all-posts";
    const cachedPosts = this.cache.get(this.contentType, allPostsCacheKey);

    if (cachedPosts) {
      return JSON.parse(cachedPosts);
    }

    try {
      // Get a list of all MDX files
      const postFiles = await this.getPostsList();

      const posts: Record<string, ContentWithMeta & { meta: BlogMeta }> = {};

      for (const filename of postFiles) {
        // Extract slug from filename (remove extension)
        const slug = filename.replace(/\.mdx$/, "");

        try {
          // Get the post document
          const post = await this.getDocument(slug);
          posts[slug] = post;
        } catch (error) {
          console.error(`Error loading post ${slug}:`, error);
          // Skip this post and continue with others
        }
      }

      // Store all posts in the cache
      this.cache.set(this.contentType, allPostsCacheKey, JSON.stringify(posts));
      return posts;
    } catch (error) {
      console.error("Error loading all posts:", error);
      throw new ContentError(
        `Failed to load all posts: ${error instanceof Error ? error.message : String(error)}`,
        this.contentType,
        undefined
      );
    }
  }
}

/**
 * Factory function for creating a BlogContentHandler
 */
export function createBlogContentHandler(
  loader?: ContentLoader,
  cache?: ContentCache
): BlogContentHandler {
  return new BlogContentHandler(loader, cache);
}

// Create a default singleton instance that can be used throughout the application
export const blogContentHandler = createBlogContentHandler();
