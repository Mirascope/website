export interface FrontmatterResult {
  frontmatter: Record<string, any>;
  content: string;
}

/**
 * Parses frontmatter from document content
 *
 * @param content - The document content with frontmatter
 * @returns An object containing the parsed frontmatter and the cleaned content
 */
export function parseFrontmatter(content: string): FrontmatterResult {
  try {
    // Check for content with frontmatter pattern
    if (!content.startsWith("---")) {
      return {
        frontmatter: {},
        content,
      };
    }

    const parts = content.split("---");

    // Handle case with empty frontmatter (---\n---)
    if (parts.length >= 3 && parts[1].trim() === "") {
      return {
        frontmatter: {},
        content: parts.slice(2).join("---").trimStart(),
      };
    }

    // Normal case with frontmatter content
    if (parts.length >= 3) {
      const frontmatterStr = parts[1].trim();
      const contentParts = parts.slice(2).join("---");
      const cleanContent = contentParts.trimStart();

      // Parse frontmatter into key-value pairs
      const frontmatter: Record<string, any> = {};

      // Split by lines and process each line
      frontmatterStr.split("\n").forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return; // Skip empty lines

        // Look for key: value format
        const colonIndex = trimmedLine.indexOf(":");
        if (colonIndex > 0) {
          const key = trimmedLine.slice(0, colonIndex).trim();
          const value = trimmedLine.slice(colonIndex + 1).trim();

          // Remove quotes if present
          frontmatter[key] = value.replace(/^["'](.*)["']$/, "$1");
        }
      });

      return {
        frontmatter,
        content: cleanContent,
      };
    }

    // If no proper frontmatter found, return original content
    return {
      frontmatter: {},
      content,
    };
  } catch (error) {
    // In case of parsing error, return the original content
    return {
      frontmatter: {},
      content,
    };
  }
}

/**
 * Merges frontmatter from different sources with optional overwriting
 *
 * @param target - The target frontmatter object
 * @param source - The source frontmatter object
 * @param overwrite - Whether to overwrite existing values (default: false)
 * @returns The merged frontmatter
 */
export function mergeFrontmatter(
  target: Record<string, any>,
  source: Record<string, any>,
  overwrite = false
): Record<string, any> {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    // Only add if the key doesn't exist or overwrite is true
    if (overwrite || !(key in result)) {
      result[key] = value;
    }
  }

  return result;
}
