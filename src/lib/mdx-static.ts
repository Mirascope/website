import { processMDX } from "./mdx-utils";
import { createContentLoader } from "./content/content-loader";
import { createContentCache } from "./content/content-cache";

// Create a dedicated cache and content loader for static MDX content
const staticCache = createContentCache();
const contentLoader = createContentLoader({ cache: staticCache });

// Cache for processed MDX content
const processedCache: Record<string, { code: string; frontmatter: Record<string, any> }> = {};

/**
 * Get documentation MDX content - unified implementation using ContentLoader
 */
export const getDocContent = async (filePath: string) => {
  // Check processed cache first
  if (processedCache[filePath]) {
    return processedCache[filePath];
  }

  try {
    // Use the content loader to get the raw MDX content
    const mdxContent = await contentLoader.loadContent(`/docs/${filePath}`, "doc");

    // Process the MDX content
    const result = await processMDX(mdxContent);

    // Cache the processed result
    processedCache[filePath] = result;

    return result;
  } catch (error) {
    console.error(`[DOCS] Error getting docs for ${filePath}:`, error);
    throw error;
  }
};
