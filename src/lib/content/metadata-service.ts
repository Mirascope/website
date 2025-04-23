import docsMetadata from "@/content/doc/_meta";
import type { ProductDocs } from "@/content/doc/_meta";
import type { ContentType, ContentMeta, ValidationResult } from "./types";
import type { DocMeta } from "./docs";
import type { BlogMeta } from "./blog";
import type { PolicyMeta } from "./policy";
import { MetadataError, DocumentNotFoundError } from "./errors";

/**
 * Extracts metadata from the structure definitions (_meta.ts)
 */
export function getMetadataFromStructure(path: string, contentType: ContentType): ContentMeta {
  if (contentType === "doc") {
    return getDocMetadataFromStructure(path);
  } else if (contentType === "blog") {
    return getBlogMetadataFromStructure(path);
  } else if (contentType === "policy") {
    return getPolicyMetadataFromStructure(path);
  }

  throw new MetadataError(contentType, path, new Error(`Unsupported content type: ${contentType}`));
}

/**
 * Extract document metadata from the structure (_meta.ts)
 */
function getDocMetadataFromStructure(path: string): DocMeta {
  // Remove /doc/ prefix and extract path parts
  const pathParts = path
    .replace(/^\/doc\//, "")
    .split("/")
    .filter((part) => part !== "");

  // Root docs path - special case
  if (path === "/doc" || path === "/doc/") {
    return {
      title: "Documentation",
      description: "",
      slug: "index",
      path: "index",
      product: "",
      type: "doc",
    };
  }

  if (pathParts.length === 0) {
    throw new DocumentNotFoundError("doc", path);
  }

  const product = pathParts[0];
  const productDocs = docsMetadata[product] as ProductDocs;

  if (!productDocs) {
    // Product not found, throw a DocumentNotFoundError
    throw new DocumentNotFoundError("doc", path);
  }

  // Initialize variables
  let title = "";
  let description = "";
  let section = "";
  let group = "";
  let slug = pathParts.length > 1 ? pathParts[pathParts.length - 1] : "index";

  // Define a function to get a default slug if needed
  const getSlug = (parts: string[]) => {
    // If path ends with a slash, use index
    if (path.endsWith("/")) return "index";

    // Otherwise use the last part
    return parts[parts.length - 1] || "index";
  };

  // Helper function to find an item at a specific path in the meta structure
  const findMetaItem = (itemPath: string[]): { item: any; meta: any } | null => {
    // No path, no item
    if (itemPath.length === 0) return null;

    // Start with product-level lookup
    if (itemPath.length === 1) {
      const slug = itemPath[0];
      if (productDocs.items && productDocs.items[slug]) {
        return {
          item: productDocs.items[slug],
          meta: {},
        };
      }
      return null;
    }

    // Check if this is a section path
    if (itemPath.length >= 2) {
      const sectionSlug = itemPath[0];
      const section = productDocs.sections?.[sectionSlug];

      if (section) {
        // Check if it's a direct section item
        if (itemPath.length === 2) {
          const itemSlug = itemPath[1];
          if (section.items && section.items[itemSlug]) {
            return {
              item: section.items[itemSlug],
              meta: {
                section: sectionSlug,
              },
            };
          }

          // Check if it's a direct section item with nested paths
          for (const [key, value] of Object.entries(section.items || {})) {
            if (value.items) {
              let currentItem = value;
              let currentPath = [key];
              let remainingPath = [...itemPath.slice(1)];

              // Try to traverse the nested structure
              while (remainingPath.length > 0 && currentItem.items) {
                const nextKey = remainingPath[0];
                if (currentItem.items[nextKey]) {
                  currentItem = currentItem.items[nextKey];
                  currentPath.push(nextKey);
                  remainingPath = remainingPath.slice(1);
                } else {
                  break;
                }
              }

              // If we consumed all remaining parts, we found our item
              if (remainingPath.length === 0) {
                return {
                  item: currentItem,
                  meta: {
                    section: sectionSlug,
                  },
                };
              }
            }
          }
        }

        // Check if it's a section group item
        if (itemPath.length >= 3) {
          const groupSlug = itemPath[1];
          const group = section.groups?.[groupSlug];

          if (group) {
            // If we're looking for just the group
            if (itemPath.length === 3) {
              const itemSlug = itemPath[2];
              if (group.items && group.items[itemSlug]) {
                return {
                  item: group.items[itemSlug],
                  meta: {
                    section: sectionSlug,
                    group: groupSlug,
                  },
                };
              }
            }

            // Check for nested items within group items
            for (const [key, value] of Object.entries(group.items || {})) {
              if (value.items) {
                let currentItem = value;
                let currentPath = [key];
                let remainingPath = [...itemPath.slice(2)];

                // Try to traverse the nested structure
                while (remainingPath.length > 0 && currentItem.items) {
                  const nextKey = remainingPath[0];
                  if (currentItem.items[nextKey]) {
                    currentItem = currentItem.items[nextKey];
                    currentPath.push(nextKey);
                    remainingPath = remainingPath.slice(1);
                  } else {
                    break;
                  }
                }

                // If we consumed all remaining parts, we found our item
                if (remainingPath.length === 0) {
                  return {
                    item: currentItem,
                    meta: {
                      section: sectionSlug,
                      group: groupSlug,
                    },
                  };
                }
              }
            }
          }
        }
      }
    }

    // Check product groups
    if (itemPath.length >= 2) {
      const groupSlug = itemPath[0];
      const group = productDocs.groups?.[groupSlug];

      if (group) {
        // Direct group item
        if (itemPath.length === 2) {
          const itemSlug = itemPath[1];
          if (group.items && group.items[itemSlug]) {
            return {
              item: group.items[itemSlug],
              meta: {
                group: groupSlug,
                groupTitle: group.title,
              },
            };
          }
        }

        // Try to find nested items
        for (const [key, value] of Object.entries(group.items || {})) {
          if (value.items) {
            let currentItem = value;
            let currentPath = [key];
            let remainingPath = [...itemPath.slice(1)];

            // Try to traverse the nested structure
            while (remainingPath.length > 0 && currentItem.items) {
              const nextKey = remainingPath[0];
              if (currentItem.items[nextKey]) {
                currentItem = currentItem.items[nextKey];
                currentPath.push(nextKey);
                remainingPath = remainingPath.slice(1);
              } else {
                break;
              }
            }

            // If we consumed all remaining parts, we found our item
            if (remainingPath.length === 0) {
              return {
                item: currentItem,
                meta: {
                  group: groupSlug,
                  groupTitle: group.title,
                },
              };
            }
          }
        }
      }
    }

    return null;
  };

  // Try to find the item using our recursive helper
  const result = findMetaItem(pathParts.slice(1));

  if (result) {
    // We found the item in the metadata structure
    const { item, meta } = result;

    return {
      title: item.title,
      description: "",
      slug,
      path: pathParts.join("/"),
      product,
      type: "doc",
      ...meta,
    };
  }

  // Handle special cases if we couldn't find the item
  // Handle top-level items with special case for paths like /doc/mirascope/migration/
  if (pathParts.length <= 2 && path.endsWith("/") && pathParts.length > 1) {
    // Treat this as a top-level item (not an index)
    // For paths like /doc/mirascope/migration/
    slug = pathParts[1]; // Use the second part

    // Look for the metadata in top-level items
    const item = productDocs.items?.[slug];
    if (item) {
      title = item.title;
      description = ""; // Empty description, will be populated from frontmatter
    } else {
      title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
      description = ""; // Empty description, will be populated from frontmatter
    }
    return {
      title,
      description,
      slug,
      path: pathParts.join("/"),
      product,
      type: "doc",
    };
  }

  // If we still can't find it, generate default metadata
  // based on the slug
  slug = getSlug(pathParts);
  title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

  return {
    title,
    description,
    slug,
    path: pathParts.join("/"),
    product,
    type: "doc",
    section,
    group,
  };
}

/**
 * Extract blog metadata from the path
 */
function getBlogMetadataFromStructure(path: string): BlogMeta {
  // Extract slug from path
  const slug = path.replace(/^\/blog\//, "").replace(/\/$/, "");

  // Create basic metadata (will be populated by frontmatter)
  return {
    title: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " "),
    description: "",
    slug,
    path: `blog/${slug}`,
    type: "blog",
    date: "",
    author: "Mirascope Team",
    readTime: "",
  };
}

/**
 * Extract policy metadata from the path
 */
function getPolicyMetadataFromStructure(path: string): PolicyMeta {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;

  // Extract slug from path
  const slug = cleanPath.split("/").pop() || "";

  // Generate a default title from the slug
  const title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");

  return {
    title,
    description: "",
    slug,
    path: cleanPath,
    type: "policy",
  };
}

/**
 * Extract metadata from frontmatter
 */
export function extractMetadataFromFrontmatter(
  frontmatter: Record<string, any>,
  contentType: ContentType,
  path: string
): Partial<ContentMeta> {
  if (contentType === "doc") {
    return extractDocMetadataFromFrontmatter(frontmatter);
  } else if (contentType === "blog") {
    return extractBlogMetadataFromFrontmatter(frontmatter);
  } else if (contentType === "policy") {
    return extractPolicyMetadataFromFrontmatter(frontmatter);
  }

  throw new MetadataError(contentType, path, new Error(`Unsupported content type: ${contentType}`));
}

/**
 * Extract doc metadata from frontmatter
 */
function extractDocMetadataFromFrontmatter(frontmatter: Record<string, any>): Partial<DocMeta> {
  return {
    title: frontmatter.title,
    description: frontmatter.description || "",
  };
}

/**
 * Extract blog metadata from frontmatter
 */
function extractBlogMetadataFromFrontmatter(frontmatter: Record<string, any>): Partial<BlogMeta> {
  return {
    title: frontmatter.title || "",
    description: frontmatter.description || "",
    date: frontmatter.date || "",
    readTime: frontmatter.readTime || "",
    author: frontmatter.author || "Mirascope Team",
    ...(frontmatter.lastUpdated && { lastUpdated: frontmatter.lastUpdated }),
  };
}

/**
 * Extract policy metadata from frontmatter
 */
function extractPolicyMetadataFromFrontmatter(
  frontmatter: Record<string, any>
): Partial<PolicyMeta> {
  return {
    title: frontmatter.title || "",
    description: frontmatter.description || "",
    lastUpdated: frontmatter.lastUpdated,
  };
}

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
