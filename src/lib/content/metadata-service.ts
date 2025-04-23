import type { ContentType, ContentMeta, ValidationResult } from "./content-types";
import type { DocMeta } from "./docs";
import type { BlogMeta } from "./blog";

/**
 * Merge metadata from multiple sources
 */
export function mergeMetadata<T extends ContentMeta>(
  structureMeta: T,
  frontmatterMeta: Partial<T>
): T {
  // Create a new object to avoid mutating the original
  const merged = { ...structureMeta };

  // Merge in the frontmatter data, giving it priority
  for (const [key, value] of Object.entries(frontmatterMeta)) {
    if (value !== undefined && value !== null) {
      (merged as any)[key] = value;
    }
  }

  return merged;
}

/**
 * Validate metadata for a content type
 */
export function validateMetadata(
  metadata: ContentMeta,
  contentType: ContentType
): ValidationResult {
  const errors: string[] = [];

  // Check for required fields
  if (!metadata.title) {
    errors.push("Missing required field: title");
  }

  if (!metadata.slug) {
    errors.push("Missing required field: slug");
  }

  if (!metadata.path) {
    errors.push("Missing required field: path");
  }

  // Type-specific validation
  if (contentType === "doc") {
    const docMeta = metadata as DocMeta;
    if (!docMeta.product) {
      errors.push("Missing required field for doc: product");
    }
  } else if (contentType === "blog") {
    const blogMeta = metadata as BlogMeta;
    if (!blogMeta.date) {
      errors.push("Missing required field for blog: date");
    }
    if (!blogMeta.author) {
      errors.push("Missing required field for blog: author");
    }
    if (!blogMeta.readTime) {
      errors.push("Missing required field for blog: readTime");
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
