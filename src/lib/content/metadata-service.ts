import docsMetadata from "../../docs/_meta";
import type { ProductDocs } from "../../docs/_meta";
import type {
  ContentType,
  ContentMeta,
  DocMeta,
  BlogMeta,
  PolicyMeta,
  ValidationResult,
} from "./content-types";
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
  // Remove /docs/ prefix and extract path parts
  const pathParts = path
    .replace(/^\/docs\//, "")
    .split("/")
    .filter((part) => part !== "");

  // Root docs path - special case
  if (path === "/docs" || path === "/docs/") {
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
  let sectionTitle = "";
  let groupTitle = "";
  let slug = pathParts.length > 1 ? pathParts[pathParts.length - 1] : "index";

  // Define a function to get a default slug if needed
  const getSlug = (parts: string[]) => {
    // If path ends with a slash, use index
    if (path.endsWith("/")) return "index";

    // Otherwise use the last part
    return parts[parts.length - 1] || "index";
  };

  // Handle top-level items with special case for paths like /docs/mirascope/migration/
  if (pathParts.length <= 2 && path.endsWith("/") && pathParts.length > 1) {
    // Treat this as a top-level item (not an index)
    // For paths like /docs/mirascope/migration/
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

  // Determine the type and extract metadata based on path structure
  if (pathParts.length === 1) {
    // Product root: /docs/mirascope/
    slug = getSlug(pathParts);

    if (slug === "index" || slug === "" || slug === "welcome" || slug === "overview") {
      // Use product index item
      const indexItem = productDocs.items?.index;

      if (indexItem) {
        title = indexItem.title;
        description = ""; // Empty description, will be populated from frontmatter
      } else {
        title = `${product.charAt(0).toUpperCase() + product.slice(1)} Documentation`;
        description = "";
      }
    } else {
      // Regular top-level item: /docs/mirascope/migration
      const item = productDocs.items?.[slug];
      if (item) {
        title = item.title;
        description = ""; // Empty description, will be populated from frontmatter
      } else {
        title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
        description = "";
      }
    }
  } else if (pathParts.length === 2) {
    // Could be a group or section: /docs/mirascope/getting-started/ or /docs/mirascope/api/
    // OR a direct top-level item: /docs/mirascope/migration
    slug = getSlug(pathParts);
    const potentialGroupOrSection = pathParts[1];

    // First check for index pages or direct top-level items
    // This needs to handle both /docs/mirascope/index and regular items
    if (
      productDocs.items &&
      ((slug === "index" && productDocs.items.index) ||
        (slug !== "index" && productDocs.items[slug]))
    ) {
      // This is a direct top-level item like /docs/mirascope/migration
      const item = productDocs.items[slug];
      title = item.title;
      description = ""; // Empty description, will be populated from frontmatter
      return {
        title,
        description,
        slug,
        path: pathParts.join("/"),
        product,
        type: "doc",
      };
    }

    // Check if it's a group
    if (productDocs.groups && productDocs.groups[potentialGroupOrSection]) {
      group = potentialGroupOrSection;
      groupTitle = productDocs.groups[group].title;

      if (slug === "index" || slug === "" || slug === "overview") {
        // Group index: /docs/mirascope/getting-started/
        title = groupTitle;
        description = ""; // Empty description, will be populated from frontmatter
      } else {
        // Group item: /docs/mirascope/getting-started/quickstart
        const item = productDocs.groups[group].items?.[slug];
        if (item) {
          title = item.title;
          description = ""; // Empty description, will be populated from frontmatter
        } else {
          title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
          description = "";
        }
      }
    }
    // Check if it's a section
    else if (productDocs.sections && productDocs.sections[potentialGroupOrSection]) {
      section = potentialGroupOrSection;
      sectionTitle = productDocs.sections[section].title;

      if (slug === "index" || slug === "" || slug === "overview") {
        // Section index: /docs/mirascope/api/
        title = sectionTitle;
        description = ""; // Empty description, will be populated from frontmatter
      } else {
        // Section item: /docs/mirascope/api/quickstart
        const item = productDocs.sections[section].items?.[slug];
        if (item) {
          title = item.title;
          description = ""; // Empty description, will be populated from frontmatter
        } else {
          title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
          description = "";
        }
      }
    } else {
      // This may be a group item path where pathParts[1] is the group and pathParts[2] is the item
      // Example: /docs/mirascope/getting-started/contributing
      if (productDocs.groups && pathParts.length >= 3 && productDocs.groups[pathParts[1]]) {
        const potentialGroup = pathParts[1];
        const potentialItem = pathParts[2];

        if (productDocs.groups[potentialGroup].items[potentialItem]) {
          // We found a matching group and item
          const itemMetadata = productDocs.groups[potentialGroup].items[potentialItem];

          return {
            title: itemMetadata.title,
            description: "",
            slug: potentialItem,
            path: pathParts.join("/"),
            product,
            type: "doc",
            group: potentialGroup,
            groupTitle: productDocs.groups[potentialGroup].title,
          };
        }
      }

      // TODO: This function needs a comprehensive refactoring to make it more maintainable
      // and to properly handle all path patterns. For now, we're adding special case handling
      // to fix immediate issues, but a complete rewrite is needed.

      // Unknown structure, throw error
      throw new DocumentNotFoundError("doc", path);
    }
  } else if (pathParts.length === 3) {
    // Section + group or deeper: /docs/mirascope/api/llm/
    slug = getSlug(pathParts);
    const potentialSection = pathParts[1];
    const potentialGroup = pathParts[2];

    // Check if it's a section+group structure
    if (
      productDocs.sections &&
      productDocs.sections[potentialSection] &&
      productDocs.sections[potentialSection].groups &&
      productDocs.sections[potentialSection].groups![potentialGroup]
    ) {
      section = potentialSection;
      group = potentialGroup;
      sectionTitle = productDocs.sections[section].title;
      groupTitle = productDocs.sections[section].groups![group].title;

      if (slug === "index" || slug === "" || slug === "overview") {
        // Section+group index: /docs/mirascope/api/llm/
        title = groupTitle;
        description = ""; // Empty description, will be populated from frontmatter
      } else {
        // Section+group item: /docs/mirascope/api/llm/generation
        const item = productDocs.sections[section].groups![group].items?.[slug];
        if (item) {
          title = item.title;
          description = ""; // Empty description, will be populated from frontmatter
        } else {
          title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
          description = "";
        }
      }
    } else {
      // This may be a group item path where pathParts[1] is the group and pathParts[2] is the item
      // Example: /docs/mirascope/getting-started/contributing
      if (productDocs.groups && pathParts.length >= 3 && productDocs.groups[pathParts[1]]) {
        const potentialGroup = pathParts[1];
        const potentialItem = pathParts[2];

        if (productDocs.groups[potentialGroup].items[potentialItem]) {
          // We found a matching group and item
          const itemMetadata = productDocs.groups[potentialGroup].items[potentialItem];

          return {
            title: itemMetadata.title,
            description: "",
            slug: potentialItem,
            path: pathParts.join("/"),
            product,
            type: "doc",
            group: potentialGroup,
            groupTitle: productDocs.groups[potentialGroup].title,
          };
        }
      }

      // TODO: This function needs a comprehensive refactoring to make it more maintainable
      // and to properly handle all path patterns. For now, we're adding special case handling
      // to fix immediate issues, but a complete rewrite is needed.

      // Unknown structure, throw error
      throw new DocumentNotFoundError("doc", path);
    }
  } else if (pathParts.length >= 4) {
    // Section + group + item: /docs/mirascope/api/llm/generation
    section = pathParts[1];
    group = pathParts[2];
    slug = pathParts[3];

    // Look for product groups first, as that's the most common pattern
    // This fixes the issue with paths like /docs/mirascope/getting-started/contributing
    if (productDocs.groups && productDocs.groups[section]) {
      // This is likely a group + item pattern where section is actually the group
      group = section;
      section = "";
      groupTitle = productDocs.groups[group].title;

      // Try to find the item in this group
      const itemSlug = group === slug ? "index" : slug;
      const item = productDocs.groups[group].items?.[itemSlug];
      if (item) {
        title = item.title;
        description = "";
        return {
          title,
          description,
          slug: itemSlug,
          path: pathParts.join("/"),
          product,
          type: "doc",
          group,
          groupTitle,
        };
      }
    }

    // If not found in groups, check if the structure exists in sections as before
    else if (
      productDocs.sections &&
      productDocs.sections[section] &&
      productDocs.sections[section].groups &&
      productDocs.sections[section].groups![group]
    ) {
      sectionTitle = productDocs.sections[section].title;
      groupTitle = productDocs.sections[section].groups![group].title;

      const item = productDocs.sections[section].groups![group].items?.[slug];
      if (item) {
        title = item.title;
        description = ""; // Empty description, will be populated from frontmatter
      } else {
        title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
        description = "";
      }
    } else {
      // This may be a group item path where pathParts[1] is the group and pathParts[2] is the item
      // Example: /docs/mirascope/getting-started/contributing
      if (productDocs.groups && pathParts.length >= 3 && productDocs.groups[pathParts[1]]) {
        const potentialGroup = pathParts[1];
        const potentialItem = pathParts[2];

        if (productDocs.groups[potentialGroup].items[potentialItem]) {
          // We found a matching group and item
          const itemMetadata = productDocs.groups[potentialGroup].items[potentialItem];

          return {
            title: itemMetadata.title,
            description: "",
            slug: potentialItem,
            path: pathParts.join("/"),
            product,
            type: "doc",
            group: potentialGroup,
            groupTitle: productDocs.groups[potentialGroup].title,
          };
        }
      }

      // TODO: This function needs a comprehensive refactoring to make it more maintainable
      // and to properly handle all path patterns. For now, we're adding special case handling
      // to fix immediate issues, but a complete rewrite is needed.

      // Unknown structure, throw error
      throw new DocumentNotFoundError("doc", path);
    }
  }

  // If title is still empty, generate one from the slug
  if (!title) {
    title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
  }

  return {
    title,
    description,
    slug,
    path: pathParts.join("/"),
    product,
    type: "doc",
    section,
    group,
    sectionTitle,
    groupTitle,
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
