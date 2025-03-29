import { mockAPI } from "./utils";

// Define the PostMeta type for frontmatter
export type PostMeta = {
  title: string;
  description: string;
  date: string;
  readTime: string;
  slug: string;
  author: string;
};

// Cache for loaded posts
let postsCache: Record<string, { content: string; meta: PostMeta }> | null = null;
let postListCache: PostMeta[] | null = null;

// Function to parse frontmatter from MDX content
const parseFrontmatter = (fileContent: string): { frontmatter: Record<string, string>, content: string } => {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = fileContent.match(frontmatterRegex);
  
  if (!match) {
    throw new Error('Invalid frontmatter format');
  }
  
  const frontmatterStr = match[1];
  const content = match[2];
  
  // Parse frontmatter into key-value pairs
  const frontmatter: Record<string, string> = {};
  const lines = frontmatterStr.split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      // Remove quotes from value if present
      const value = line.slice(colonIndex + 1).trim().replace(/^"(.*)"$/, '$1');
      frontmatter[key] = value;
    }
  }
  
  return { frontmatter, content };
};

// Function to load all posts
const loadAllPosts = async (): Promise<Record<string, { content: string; meta: PostMeta }>> => {
  if (postsCache) {
    return postsCache;
  }
  
  try {
    // Get a list of all MDX files
    const postFiles = await mockAPI.getPostsList();
    
    const posts: Record<string, { content: string; meta: PostMeta }> = {};
    
    for (const filename of postFiles) {
      // Extract slug from filename (remove extension)
      const slug = filename.replace(/\.mdx$/, '');
      
      // Fetch the post content
      const fileContent = await mockAPI.getPostContent(filename);
      
      // Parse frontmatter and content
      const { frontmatter, content } = parseFrontmatter(fileContent);
      
      posts[slug] = {
        content,
        meta: {
          title: frontmatter.title || '',
          description: frontmatter.description || '',
          date: frontmatter.date || '',
          readTime: frontmatter.readTime || '',
          author: frontmatter.author || 'Mirascope Team',
          slug,
        }
      };
    }
    
    postsCache = posts;
    return posts;
  } catch (error) {
    console.error('Error loading posts:', error);
    
    // Just rethrow the error - no fallback data in this example
    throw error;
  }
};

// Get post content by slug
export const getPostBySlug = async (slug: string): Promise<{ meta: PostMeta, content: string }> => {
  console.log(`[MDX] getPostBySlug called with slug: ${slug}`);
  
  const posts = await loadAllPosts();
  const post = posts[slug];
  
  if (post) {
    console.log(`[MDX] Found post data for slug: ${slug}`);
    return { meta: post.meta, content: post.content };
  }
  
  console.log(`[MDX] Post not found for slug: ${slug}`);
  throw new Error(`Post not found: ${slug}`);
};

// Get all posts metadata
export const getAllPosts = async (): Promise<PostMeta[]> => {
  console.log('[MDX] Getting all posts');
  
  if (postListCache) {
    return postListCache;
  }
  
  const posts = await loadAllPosts();
  const postList = Object.values(posts).map(post => post.meta);
  
  // Sort posts by date in descending order
  const sortedPosts = postList.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  postListCache = sortedPosts;
  return sortedPosts;
};