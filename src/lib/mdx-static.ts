import { processMDX } from "./mdx-utils";
import { docsAPI } from "./utils";

// Check if we're in production environment
const isProduction = import.meta.env.PROD;

// Cache for processed MDX content
const contentCache: Record<string, { code: string; frontmatter: Record<string, any> }> = {};

/**
 * Get documentation MDX content in development mode - using API
 */
const getDocContentDev = async (filePath: string) => {
  // Check cache first
  if (contentCache[filePath]) {
    return contentCache[filePath];
  }

  try {
    // Fetch and process MDX content
    const mdxContent = await docsAPI.getDocContent(filePath);
    const result = await processMDX(mdxContent);

    // Cache the result
    contentCache[filePath] = result;

    return result;
  } catch (error) {
    console.error(`[DOCS] Development: Error getting docs for ${filePath}:`, error);
    throw error;
  }
};

/**
 * Get documentation MDX content in production mode (from static files)
 */
const getDocContentProd = async (filePath: string) => {
  // Check cache first
  if (contentCache[filePath]) {
    return contentCache[filePath];
  }

  try {
    // In production mode, fetch the pre-processed JSON files
    console.log(`[DOCS] Production: Loading static docs file for ${filePath}`);

    // Normalize path for the JSON filename
    const normalizedPath = filePath.replace(/\\/g, "/");

    const response = await fetch(`/static/docs/${normalizedPath}.json`);

    if (!response.ok) {
      throw new Error(`Error fetching doc content: ${response.statusText}`);
    }

    const data = await response.json();

    // Process the raw MDX content
    const result = await processMDX(data.content);

    // Cache the result
    contentCache[filePath] = result;

    return result;
  } catch (error) {
    console.error(`[DOCS] Production: Error getting docs for ${filePath}:`, error);
    throw error;
  }
};

/**
 * Get documentation MDX content - uses the appropriate implementation based on environment
 */
export const getDocContent = isProduction ? getDocContentProd : getDocContentDev;
