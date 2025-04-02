import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API for accessing MDX posts
export const mockAPI = {
  /**
   * Get a list of all MDX post files
   */
  async getPostsList(): Promise<string[]> {
    // Fetch the list of MDX files from the virtual API endpoint
    try {
      const response = await fetch("/api/posts-list");
      if (!response.ok) {
        throw new Error(`Error fetching posts list: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching posts list:", error);
      throw error;
    }
  },

  /**
   * Get the content of a specific MDX file
   */
  async getPostContent(filename: string): Promise<string> {
    try {
      // Fetch the MDX content from the virtual API endpoint
      const response = await fetch(`/posts/${filename}`);
      if (!response.ok) {
        throw new Error(`Error fetching post content: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Error fetching post content for ${filename}:`, error);
      throw error;
    }
  },
};

// API for accessing documentation files
export const docsAPI = {
  /**
   * Get the content of a specific MDX documentation file
   */
  async getDocContent(filePath: string): Promise<string> {
    try {
      // Log the file path we're trying to fetch for debugging
      console.log(`Fetching doc content for: /src/docs/${filePath}`);

      // Fetch the MDX content from the docs directory
      const response = await fetch(`/src/docs/${filePath}`);
      if (!response.ok) {
        throw new Error(`Error fetching doc content: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Error fetching doc content for ${filePath}:`, error);
      throw error;
    }
  },
};
