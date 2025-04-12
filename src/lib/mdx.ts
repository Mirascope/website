import { mockAPI } from "./utils";
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

// Check if we're in production environment
const isProduction = import.meta.env.PROD;

// Shared caches
let postsCache: Record<string, PostContent> | null = null;
let postListCache: PostMeta[] | null = null;

// ==== DEVELOPMENT MODE IMPLEMENTATION ====

// Function to load all posts in development
const loadAllPostsDev = async (): Promise<Record<string, PostContent>> => {
  if (postsCache) {
    return postsCache;
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

    postsCache = posts;
    return posts;
  } catch (error) {
    console.error("Error loading posts:", error);
    throw error;
  }
};

// Get post by slug in development mode
const getPostBySlugDev = async (slug: string): Promise<PostContent> => {
  console.log(`[MDX] Development: getPostBySlug called with slug: ${slug}`);

  const posts = await loadAllPostsDev();
  const post = posts[slug];

  if (post) {
    console.log(`[MDX] Found post data for slug: ${slug}`);
    return post;
  }

  console.log(`[MDX] Post not found for slug: ${slug}`);
  throw new Error(`Post not found: ${slug}`);
};

// Get all posts in development mode
const getAllPostsDev = async (): Promise<PostMeta[]> => {
  console.log("[MDX] Development: Getting all posts");

  if (postListCache) {
    return postListCache;
  }

  const posts = await loadAllPostsDev();
  const postList = Object.values(posts).map((post) => post.meta);

  // Sort posts by date in descending order
  const sortedPosts = postList.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  postListCache = sortedPosts;
  return sortedPosts;
};

// ==== PRODUCTION MODE IMPLEMENTATION ====

// Get post by slug in production mode
const getPostBySlugProd = async (slug: string): Promise<PostContent> => {
  console.log(`[MDX] Production: getPostBySlug called with slug: ${slug}`);

  try {
    const response = await fetch(`/static/posts/${slug}.json`);

    if (!response.ok) {
      throw new Error(`Failed to fetch post: ${response.statusText}`);
    }

    const data = await response.json();

    // Return the raw content directly - we'll process it when rendering
    return {
      meta: data.meta,
      content: data.content, // Raw MDX content
    };
  } catch (error) {
    console.error(`[MDX] Error loading static post data for ${slug}:`, error);
    throw new Error(`Post not found: ${slug}`);
  }
};

// Get all posts in production mode
const getAllPostsProd = async (): Promise<PostMeta[]> => {
  console.log("[MDX] Production: Getting all posts");

  if (postListCache) {
    return postListCache;
  }

  try {
    const response = await fetch("/static/posts-list.json");

    if (!response.ok) {
      throw new Error(`Failed to fetch posts list: ${response.statusText}`);
    }

    const data: PostMeta[] = await response.json();
    postListCache = data;
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
