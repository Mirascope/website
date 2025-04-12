import type { ContentType } from "./content-types";
import type { ValidationResult } from "./content-types";

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
    // Extract anything between the first two '---' markers
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (match) {
      const frontmatterStr = match[1];
      const cleanContent = match[2];

      // Parse frontmatter into key-value pairs
      const frontmatter: Record<string, any> = {};
      const lines = frontmatterStr.split("\n");

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue; // Skip empty lines

        // Look for key: value format
        const colonIndex = trimmedLine.indexOf(":");
        if (colonIndex > 0) {
          const key = trimmedLine.slice(0, colonIndex).trim();
          const value = trimmedLine.slice(colonIndex + 1).trim();

          // Remove quotes if present
          frontmatter[key] = value.replace(/^["'](.*)["']$/, "$1");
        }
      }

      return {
        frontmatter,
        content: cleanContent,
      };
    }

    // Handle alternative format with multiple parts
    const parts = content.split("---");
    if (parts.length >= 3) {
      const frontmatterStr = parts[1].trim();
      const contentParts = parts.slice(2).join("---");
      const cleanContent = contentParts.trimStart();

      // Parse the frontmatter into a key-value object
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

    // If no frontmatter found, return the original content
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
 * Validates frontmatter against requirements for a specific content type
 *
 * @param frontmatter - The frontmatter to validate
 * @param contentType - The type of content to validate against
 * @returns Validation result with errors if invalid
 */
export function validateFrontmatter(
  frontmatter: Record<string, any>,
  contentType: ContentType
): ValidationResult {
  const errors: string[] = [];

  // Common validation for all content types
  if (!frontmatter.title) {
    errors.push("Missing required field: title");
  }

  // Type-specific validation
  switch (contentType) {
    case "blog":
      if (!frontmatter.date) errors.push("Missing required field: date");
      if (!frontmatter.author) errors.push("Missing required field: author");
      break;

    case "doc":
      // Optional validation for docs
      break;

    case "policy":
      // Optional validation for policies
      break;
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
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
