import { processMDX } from "./mdx-utils";
import { parseFrontmatter } from "./content/frontmatter";
import { DocumentNotFoundError } from "./content/errors";
import { createContentCache } from "./content/content-cache";
import { createContentLoader } from "./content/content-loader";

/**
 * PolicyMeta - Type for policy/terms metadata from frontmatter
 */
export interface PolicyMeta {
  title: string;
  lastUpdated?: string;
}

/**
 * Cleans up content after frontmatter parsing by removing source map URLs
 */
const cleanContent = (content: string): string => {
  return content.replace(/\/\/# sourceMappingURL=.*$/gm, "");
};

// Create a shared cache and content loader for policies
const policyCache = createContentCache();
const contentLoader = createContentLoader({ cache: policyCache });

/**
 * Fetch and process a policy or terms MDX file
 */
export const fetchPolicyContent = async (
  path: string
): Promise<{
  meta: PolicyMeta;
  content: string;
  compiledMDX: { code: string; frontmatter: Record<string, any> };
}> => {
  try {
    // Use the content loader to get the content
    const mdxContent = await contentLoader.loadContent(path, "policy");

    // Parse frontmatter and content
    const { frontmatter, content: rawContent } = parseFrontmatter(mdxContent);
    const content = cleanContent(rawContent);

    // Create meta object from frontmatter
    const meta: PolicyMeta = {
      title: frontmatter.title,
      lastUpdated: frontmatter.lastUpdated,
    };

    // Process the MDX content
    const compiledMDX = await processMDX(content);

    return { meta, content, compiledMDX };
  } catch (error) {
    console.error(`Error loading policy content from ${path}:`, error);

    // If it's already a DocumentNotFoundError, just re-throw it
    if (error instanceof DocumentNotFoundError) {
      throw error;
    }

    // Otherwise, throw a generic error
    throw new Error(`Failed to load policy content from ${path}`);
  }
};

/**
 * Format a date string to "Month Day, Year" format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Los_Angeles",
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString;
  }
};
