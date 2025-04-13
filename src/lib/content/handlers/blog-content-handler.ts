import type { ContentWithMeta, BlogMeta } from "@/lib/content/content-types";
import type { ContentTypeHandler } from "@/lib/content/handlers/content-type-handler";
import { parseFrontmatter } from "@/lib/content/frontmatter";
import { isValidPath } from "@/lib/content/path-resolver";
import { extractMetadataFromFrontmatter, validateMetadata } from "@/lib/content/metadata-service";
import {
  ContentError,
  DocumentNotFoundError,
  InvalidPathError,
  MetadataError,
} from "@/lib/content/errors";
import { ContentLoader, createContentLoader } from "@/lib/content/content-loader";
import { ContentCache, createContentCache } from "@/lib/content/content-cache";

/**
 * Handler for blog content
 */
export class BlogContentHandler implements ContentTypeHandler<BlogMeta> {
  private loader: ContentLoader;
  private cache: ContentCache;
  private isProduction = import.meta.env.PROD;

  /**
   * Creates a new BlogContentHandler
   *
   * @param loader - Content loader instance
   * @param cache - Optional cache instance
   */
  constructor(loader: ContentLoader, cache?: ContentCache) {
    this.loader = loader;
    this.cache = cache || createContentCache();
  }

  /**
   * Retrieves a blog post by slug
   */
  async getDocument(slug: string): Promise<ContentWithMeta & { meta: BlogMeta }> {
    try {
      // Check cache first if available
      const cacheKey = `post:${slug}`;
      if (this.cache) {
        const cached = this.cache.get("blog", cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Construct the path for the blog post
      const blogPath = `/blog/${slug}`;

      // Validate the path (using the full path)
      if (!isValidPath(blogPath, "blog")) {
        throw new InvalidPathError("blog", blogPath);
      }

      // Load the document content
      const rawContent = await this.loader.loadContent(blogPath, "blog");

      // Parse frontmatter
      const { frontmatter, content } = parseFrontmatter(rawContent);

      // Extract metadata from frontmatter
      // Not using extractMetadataFromFrontmatter since we construct the meta object manually
      extractMetadataFromFrontmatter(frontmatter, "blog", slug);

      // Create the meta object
      const meta: BlogMeta = {
        title: frontmatter.title || "",
        description: frontmatter.description || "",
        date: frontmatter.date || "",
        readTime: frontmatter.readTime || "",
        author: frontmatter.author || "Mirascope Team",
        slug,
        path: slug,
        type: "blog",
        ...(frontmatter.lastUpdated && { lastUpdated: frontmatter.lastUpdated }),
      };

      // Validate the final metadata
      const validation = validateMetadata(meta, "blog");
      if (!validation.isValid) {
        throw new MetadataError(
          "blog",
          slug,
          new Error(`Invalid metadata: ${validation.errors?.join(", ")}`)
        );
      }

      const result = { meta, content };

      // Cache the result
      if (this.cache) {
        this.cache.set("blog", cacheKey, JSON.stringify(result));
      }

      return result;
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof DocumentNotFoundError ||
        error instanceof InvalidPathError ||
        error instanceof MetadataError ||
        error instanceof ContentError
      ) {
        throw error;
      }

      // Wrap other errors
      throw new ContentError(`Failed to get blog post: ${slug}`, "blog", slug);
    }
  }

  /**
   * Gets all blog posts
   */
  async getAllDocuments(filter?: (meta: BlogMeta) => boolean): Promise<BlogMeta[]> {
    try {
      // Check cache first
      const cacheKey = "posts-list";
      if (this.cache) {
        const cached = this.cache.get("blog", cacheKey);
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
        this.cache.set("blog", cacheKey, JSON.stringify(sortedPosts));
      }

      // Apply filter if provided
      return filter ? sortedPosts.filter(filter) : sortedPosts;
    } catch (error) {
      throw new ContentError(
        `Failed to get all blog posts: ${error instanceof Error ? error.message : String(error)}`,
        "blog",
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
    const cachedPostsFiles = this.cache.get("blog", postsListFilesKey);

    if (cachedPostsFiles) {
      return JSON.parse(cachedPostsFiles);
    }

    try {
      // Choose implementation based on environment
      let postFiles: string[];

      if (this.isProduction) {
        // Production: Use pre-generated static JSON file
        const response = await fetch("/static/posts-list-files.json");
        if (!response.ok) {
          throw new Error(`Error fetching posts list: ${response.statusText}`);
        }
        postFiles = await response.json();
      } else {
        // Development: Use the virtual middleware endpoint
        const response = await fetch("/api/posts-list");
        if (!response.ok) {
          throw new Error(`Error fetching posts list: ${response.statusText}`);
        }
        postFiles = await response.json();
      }

      // Cache the list
      this.cache.set("blog", postsListFilesKey, JSON.stringify(postFiles));
      return postFiles;
    } catch (error) {
      console.error("Error fetching posts list:", error);
      throw new ContentError(
        `Failed to fetch posts list: ${error instanceof Error ? error.message : String(error)}`,
        "blog",
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
    const cachedPosts = this.cache.get("blog", allPostsCacheKey);

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
      this.cache.set("blog", allPostsCacheKey, JSON.stringify(posts));
      return posts;
    } catch (error) {
      console.error("Error loading all posts:", error);
      throw new ContentError(
        `Failed to load all posts: ${error instanceof Error ? error.message : String(error)}`,
        "blog",
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
  return new BlogContentHandler(
    loader || createContentLoader({ cache }),
    cache || createContentCache()
  );
}

// Create a default singleton instance that can be used throughout the application
export const blogContentHandler = createBlogContentHandler();
