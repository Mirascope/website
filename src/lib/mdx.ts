// Import types but use them internally via the handler
import "@/lib/content/content-types";
import { DocumentNotFoundError } from "@/lib/content/errors";

// Import the BlogContentHandler
import { blogContentHandler } from "@/lib/content/handlers/blog-content-handler";

// Re-export BlogMeta as PostMeta for backward compatibility
export type PostMeta = {
  title: string;
  description: string;
  date: string;
  readTime: string;
  slug: string;
  author: string;
  lastUpdated?: string;
};

// Type definition for post content (for backward compatibility)
type PostContent = { meta: PostMeta; content: string };

// Get post by slug - proxies to the BlogContentHandler
export const getPostBySlug = async (slug: string): Promise<PostContent> => {
  console.log(`[MDX] getPostBySlug called with slug: ${slug}`);

  try {
    const blogPost = await blogContentHandler.getDocument(slug);

    // Convert BlogWithContent to PostContent for backward compatibility
    // This ensures existing components can continue to work without changes
    return {
      content: blogPost.content,
      meta: {
        title: blogPost.meta.title,
        description: blogPost.meta.description || "",
        date: blogPost.meta.date,
        readTime: blogPost.meta.readTime,
        author: blogPost.meta.author,
        slug: blogPost.meta.slug,
        ...(blogPost.meta.lastUpdated && { lastUpdated: blogPost.meta.lastUpdated }),
      },
    };
  } catch (error) {
    console.error(`[MDX] Post not found for slug: ${slug}`);

    // If it's already a DocumentNotFoundError, just throw it
    if (error instanceof DocumentNotFoundError) {
      throw error;
    }

    // Otherwise, convert to a DocumentNotFoundError
    throw new DocumentNotFoundError("blog", `/blog/${slug}`);
  }
};

// Get all posts metadata
export const getAllPosts = async (): Promise<PostMeta[]> => {
  console.log("[MDX] Getting all posts");

  try {
    const blogPosts = await blogContentHandler.getAllDocuments();

    // Convert BlogMeta[] to PostMeta[] for backward compatibility
    return blogPosts.map((post) => ({
      title: post.title,
      description: post.description || "",
      date: post.date,
      readTime: post.readTime,
      author: post.author,
      slug: post.slug,
      ...(post.lastUpdated && { lastUpdated: post.lastUpdated }),
    }));
  } catch (error) {
    console.error("[MDX] Error loading posts list:", error);
    throw error;
  }
};
