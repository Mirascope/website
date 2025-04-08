import { processMDX } from "./mdx-utils";

/**
 * PolicyMeta - Type for policy/terms metadata from frontmatter
 */
export interface PolicyMeta {
  title: string;
  lastUpdated?: string;
}

/**
 * Parse frontmatter from MDX content
 */
export const parseFrontmatter = (
  fileContent: string
): { frontmatter: Record<string, string>; content: string } => {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = fileContent.match(frontmatterRegex);

  if (!match) {
    throw new Error("Invalid frontmatter format");
  }

  const frontmatterStr = match[1];
  const content = match[2].replace(/\/\/# sourceMappingURL=.*$/gm, "");

  // Parse frontmatter into key-value pairs
  const frontmatter: Record<string, string> = {};
  const lines = frontmatterStr.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      // Remove quotes from value if present
      const value = line
        .slice(colonIndex + 1)
        .trim()
        .replace(/^"(.*)"$/, "$1");
      frontmatter[key] = value;
    }
  }

  return { frontmatter, content };
};

/**
 * Fetch and process a policy or terms MDX file
 */
export const fetchPolicyContent = async (
  filePath: string
): Promise<{
  meta: PolicyMeta;
  content: string;
  compiledMDX: { code: string; frontmatter: Record<string, any> };
}> => {
  try {
    // Fetch the MDX file
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Error fetching content: ${response.statusText}`);
    }

    const mdxContent = await response.text();

    // Parse frontmatter and content
    const { frontmatter, content } = parseFrontmatter(mdxContent);

    // Create meta object from frontmatter
    const meta: PolicyMeta = {
      title: frontmatter.title,
      lastUpdated: frontmatter.lastUpdated,
    };

    // Process the MDX content
    const compiledMDX = await processMDX(content);

    return { meta, content, compiledMDX };
  } catch (error) {
    console.error(`Error loading content from ${filePath}:`, error);
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
