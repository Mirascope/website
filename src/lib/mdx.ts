import { parseFrontmatter } from "./content/frontmatter";

// Define the PostMeta type for frontmatter
export type PostMeta = {
  title: string;
  description: string;
  date: string;
  readTime: string;
  slug: string;
  author: string;
  lastUpdated?: string;
};

// Type definition for post content
type PostContent = { meta: PostMeta; content: string };

// Import the ContentLoader and other utilities
import { createContentCache } from "./content/content-cache";
import { createContentLoader } from "./content/content-loader";
import { DocumentNotFoundError } from "./content/errors";

// Check if we're in production environment
const isProduction = import.meta.env.PROD;

// Create a shared cache and content loader
const blogCache = createContentCache();
const contentLoader = createContentLoader({ cache: blogCache });

/**
 * Get list of blog posts - development implementation
 * Uses the virtual middleware endpoint from the Vite plugin
 */
const getPostsListDev = async (): Promise<string[]> => {
  try {
    const response = await fetch("/api/posts-list");
    if (!response.ok) {
      throw new Error(`Error fetching posts list: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching posts list in dev:", error);
    throw error;
  }
};

/**
 * Get list of blog posts - production implementation
 * Uses a pre-generated static JSON file
 */
const getPostsListProd = async (): Promise<string[]> => {
  try {
    const response = await fetch("/static/posts-list-files.json");
    if (!response.ok) {
      throw new Error(`Error fetching posts list: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching posts list in prod:", error);
    throw error;
  }
};

/**
 * Get a list of all blog post files (abstracting over dev/prod differences)
 */
const getPostsList = async (): Promise<string[]> => {
  // Check the cache first
  const postsListFilesKey = "posts-list-files";
  const cachedPostsFiles = blogCache.get("blog", postsListFilesKey);

  if (cachedPostsFiles) {
    return JSON.parse(cachedPostsFiles);
  }

  // Choose implementation based on environment
  const postFiles = isProduction ? await getPostsListProd() : await getPostsListDev();

  // Cache the list
  blogCache.set("blog", postsListFilesKey, JSON.stringify(postFiles));
  return postFiles;
};

/**
 * Load all posts with their content and metadata
 */
const loadAllPosts = async (): Promise<Record<string, PostContent>> => {
  // Create a key for the entire posts collection
  const allPostsCacheKey = "all-posts";
  const cachedPosts = blogCache.get("blog", allPostsCacheKey);

  if (cachedPosts) {
    return JSON.parse(cachedPosts);
  }

  try {
    // Get a list of all MDX files
    const postFiles = await getPostsList();

    const posts: Record<string, PostContent> = {};

    for (const filename of postFiles) {
      // Extract slug from filename (remove extension)
      const slug = filename.replace(/\.mdx$/, "");

      try {
        // Use the content loader to get content
        const fileContent = await contentLoader.loadContent(`/blog/${slug}`, "blog");

        // Parse frontmatter and content
        const { frontmatter, content } = parseFrontmatter(fileContent);

        posts[slug] = {
          content,
          meta: {
            title: frontmatter.title || "",
            description: frontmatter.description || "",
            date: frontmatter.date || "",
            readTime: frontmatter.readTime || "",
            author: frontmatter.author || "Mirascope Team",
            slug,
            ...(frontmatter.lastUpdated && { lastUpdated: frontmatter.lastUpdated }),
          },
        };
      } catch (error) {
        console.error(`Error loading post ${slug}:`, error);
        // Skip this post and continue with others
      }
    }

    // Store all posts in the cache
    blogCache.set("blog", allPostsCacheKey, JSON.stringify(posts));
    return posts;
  } catch (error) {
    console.error("Error loading posts:", error);
    throw error;
  }
};

// Get post by slug - unified implementation
export const getPostBySlug = async (slug: string): Promise<PostContent> => {
  console.log(`[MDX] getPostBySlug called with slug: ${slug}`);

  // Check if the post is cached individually
  const postCacheKey = `post:${slug}`;
  const cachedPost = blogCache.get("blog", postCacheKey);

  if (cachedPost) {
    console.log(`[MDX] Using cached post for slug: ${slug}`);
    return JSON.parse(cachedPost);
  }

  try {
    // Try to load the post using ContentLoader
    const blogPath = `/blog/${slug}`;
    const fileContent = await contentLoader.loadContent(blogPath, "blog");

    // Parse frontmatter and content
    const { frontmatter, content } = parseFrontmatter(fileContent);

    // Create the post object
    const post = {
      content,
      meta: {
        title: frontmatter.title || "",
        description: frontmatter.description || "",
        date: frontmatter.date || "",
        readTime: frontmatter.readTime || "",
        author: frontmatter.author || "Mirascope Team",
        slug,
        ...(frontmatter.lastUpdated && { lastUpdated: frontmatter.lastUpdated }),
      },
    };

    // Cache the individual post
    blogCache.set("blog", postCacheKey, JSON.stringify(post));
    return post;
  } catch (error) {
    console.error(`[MDX] Post not found for slug: ${slug}`);
    throw new DocumentNotFoundError("blog", `/blog/${slug}`);
  }
};

// Get all posts metadata
export const getAllPosts = async (): Promise<PostMeta[]> => {
  console.log("[MDX] Getting all posts");

  // Create a key for the posts list
  const postsListKey = "posts-list";
  const cachedPostsList = blogCache.get("blog", postsListKey);

  if (cachedPostsList) {
    return JSON.parse(cachedPostsList);
  }

  try {
    // Try to load all posts - ContentLoader handles dev/prod differences
    const posts = await loadAllPosts();
    const postList = Object.values(posts).map((post) => post.meta);

    // Sort posts by date in descending order
    const sortedPosts = postList.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    // Store sorted posts in the cache
    blogCache.set("blog", postsListKey, JSON.stringify(sortedPosts));
    return sortedPosts;
  } catch (error) {
    console.error("[MDX] Error loading posts list:", error);
    throw error;
  }
};
