import { processMDX } from "./mdx-utils";
import { parseFrontmatter } from "./content/frontmatter";
import { getContentPath } from "./content/path-resolver";

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
    // Get the content path for the current environment
    const staticPath = getContentPath(path, "policy");

    // Fetch the MDX file
    const response = await fetch(staticPath);
    if (!response.ok) {
      throw new Error(`Error fetching content: ${response.statusText}`);
    }

    const mdxContent = await response.text();

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
    console.error(`Error loading content from ${path}:`, error);
    throw error;
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
