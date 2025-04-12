import { mockAPI } from "./utils";
import { parseFrontmatter } from "./content/frontmatter";
import { getContentPath } from "./content/path-resolver";

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

// Check if we're in production environment
const isProduction = import.meta.env.PROD;

// Import the content cache implementation
import { createContentCache } from "./content/content-cache";

// Single cache for all blog content
const blogCache = createContentCache();

// ==== DEVELOPMENT MODE IMPLEMENTATION ====

// Function to load all posts in development
const loadAllPostsDev = async (): Promise<Record<string, PostContent>> => {
  // Create a key for the entire posts collection
  const allPostsCacheKey = "all-posts";
  const cachedPosts = blogCache.get("blog", allPostsCacheKey);

  if (cachedPosts) {
    return JSON.parse(cachedPosts);
  }

  try {
    // Get a list of all MDX files
    const postFiles = await mockAPI.getPostsList();

    const posts: Record<string, PostContent> = {};

    for (const filename of postFiles) {
      // Extract slug from filename (remove extension)
      const slug = filename.replace(/\.mdx$/, "");

      // Fetch the post content
      const fileContent = await mockAPI.getPostContent(filename);

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
    }

    // Store all posts in the cache
    blogCache.set("blog", allPostsCacheKey, JSON.stringify(posts));
    return posts;
  } catch (error) {
    console.error("Error loading posts:", error);
    throw error;
  }
};

// Get post by slug in development mode
const getPostBySlugDev = async (slug: string): Promise<PostContent> => {
  console.log(`[MDX] Development: getPostBySlug called with slug: ${slug}`);

  // Check if the post is cached individually
  const cachedPost = blogCache.get("blog", `post:${slug}`);
  if (cachedPost) {
    console.log(`[MDX] Using cached post for slug: ${slug}`);
    return JSON.parse(cachedPost);
  }

  // Otherwise, try to get it from the full posts collection
  const posts = await loadAllPostsDev();
  const post = posts[slug];

  if (post) {
    console.log(`[MDX] Found post data for slug: ${slug}`);
    // Cache the individual post
    blogCache.set("blog", `post:${slug}`, JSON.stringify(post));
    return post;
  }

  console.log(`[MDX] Post not found for slug: ${slug}`);
  throw new Error(`Post not found: ${slug}`);
};

// Get all posts in development mode
const getAllPostsDev = async (): Promise<PostMeta[]> => {
  console.log("[MDX] Development: Getting all posts");

  // Create a key for the posts list
  const postsListKey = "posts-list";
  const cachedPostsList = blogCache.get("blog", postsListKey);

  if (cachedPostsList) {
    return JSON.parse(cachedPostsList);
  }

  const posts = await loadAllPostsDev();
  const postList = Object.values(posts).map((post) => post.meta);

  // Sort posts by date in descending order
  const sortedPosts = postList.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Store sorted posts in the cache
  blogCache.set("blog", postsListKey, JSON.stringify(sortedPosts));
  return sortedPosts;
};

// ==== PRODUCTION MODE IMPLEMENTATION ====

// Get post by slug in production mode
const getPostBySlugProd = async (slug: string): Promise<PostContent> => {
  console.log(`[MDX] Production: getPostBySlug called with slug: ${slug}`);

  // Check if the post is cached individually
  const cachedPost = blogCache.get("blog", `post:${slug}`);
  if (cachedPost) {
    console.log(`[MDX] Using cached post for slug: ${slug}`);
    return JSON.parse(cachedPost);
  }

  try {
    // Get the content path for the current environment
    const blogPath = `/blog/${slug}`;
    const staticPath = getContentPath(blogPath, "blog");
    const response = await fetch(staticPath);

    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.statusText}`);
    }

    const data = await response.json();

    // Prepare the post data
    const post = {
      meta: data.meta,
      content: data.content, // Raw MDX content
    };

    // Cache the individual post
    blogCache.set("blog", `post:${slug}`, JSON.stringify(post));

    // Return the raw content directly - we'll process it when rendering
    return post;
  } catch (error) {
    console.error(`[MDX] Error loading static post data for ${slug}:`, error);
    throw new Error(`Post not found: ${slug}`);
  }
};

// Get all posts in production mode
const getAllPostsProd = async (): Promise<PostMeta[]> => {
  console.log("[MDX] Production: Getting all posts");

  // Create a key for the posts list
  const postsListKey = "posts-list";
  const cachedPostsList = blogCache.get("blog", postsListKey);

  if (cachedPostsList) {
    return JSON.parse(cachedPostsList);
  }

  try {
    const response = await fetch("/static/posts-list.json");

    if (!response.ok) {
      throw new Error(`Failed to fetch posts list: ${response.statusText}`);
    }

    const data: PostMeta[] = await response.json();
    // Store the data in the cache
    blogCache.set("blog", postsListKey, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("[MDX] Error loading static posts list:", error);
    throw error;
  }
};

// ==== PUBLIC API ====

// Get post content by slug - choose the right implementation based on environment
export const getPostBySlug = isProduction ? getPostBySlugProd : getPostBySlugDev;

// Get all posts metadata - choose the right implementation based on environment
export const getAllPosts = isProduction ? getAllPostsProd : getAllPostsDev;
