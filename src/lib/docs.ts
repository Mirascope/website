// Import the centralized meta file
import docsMetadata from "../docs/_meta";
import type { ProductDocs } from "../docs/_meta";
import { docsAPI } from "./utils";
import { parseFrontmatter } from "./content/frontmatter";
import { normalizePath, getContentPath, isValidPath } from "./content/path-resolver";

// Check if we're in production environment
const isProduction = import.meta.env.PROD;

// Types for documentation handling
export type DocType = "item" | "group-item" | "section-item" | "section-group-item";

// Document metadata
export type DocMeta = {
  title: string;
  description?: string;
  slug: string;
  path: string;
  product: string;
  type: DocType;

  // Optional group/section information
  group?: string;
  section?: string;
  groupTitle?: string;
  sectionTitle?: string;
};

// Document with content
export type DocWithContent = {
  meta: DocMeta;
  content: string;
};

// Cache for loaded documentation content
import { createContentCache } from "./content/content-cache";
const docsCache = createContentCache();

// Get document by path
export const getDoc = async (path: string): Promise<DocWithContent> => {
  try {
    // Validate the path
    if (!isValidPath(path, "doc")) {
      console.warn(`[getDoc] Invalid path format: ${path}`);
    }

    // Use the path resolver to normalize the path
    const filePath = normalizePath(path, "doc");

    // Save the original path parts for metadata lookup
    const originalPathParts = filePath.split("/").filter((part) => part !== "");

    // Debug log for diagnosing path issues
    console.log(
      `[getDoc] Original path: ${path}, Normalized file path: ${filePath}, Path parts:`,
      originalPathParts
    );

    // Attempt to load the file
    let content;

    try {
      // Check cache first
      content = docsCache.get("doc", filePath);
      if (content) {
        console.log(`[getDoc] Using cached content for: ${filePath}`);
      } else {
        // For product index pages like mirascope/index.mdx, also check the _meta.ts
        // to ensure we have valid metadata even if the file doesn't physically exist
        const isProductIndex = filePath.split("/").length === 2 && filePath.endsWith("/index.mdx");

        try {
          // In development mode, use the docsAPI to fetch content
          // In production mode, fetch static JSON files
          if (!isProduction) {
            // Development mode - use the API
            console.log(`[getDoc] Attempting to fetch document via API: ${filePath}`);
            content = await docsAPI.getDocContent(filePath);
          } else {
            // Production mode - use static files
            console.log(`[getDoc] Attempting to fetch document from static files: ${filePath}`);
            const staticPath = getContentPath(path, "doc");
            const response = await fetch(staticPath);

            if (!response.ok) {
              throw new Error(`Error fetching doc content: ${response.statusText}`);
            }

            const data = await response.json();
            content = data.content;
          }

          console.log(`[getDoc] Successfully fetched content for: ${filePath}`);
          docsCache.set("doc", filePath, content);
        } catch (error) {
          const fetchError = error as Error;
          console.error(`[getDoc] Error fetching doc content: ${fetchError.message}`);

          // Special handling for product index pages
          if (isProductIndex) {
            const product = filePath.split("/")[0];
            console.log(`[getDoc] Generating fallback for product index: ${product}`);

            // Check if this is a known product
            const isKnownProduct = product in docsMetadata;

            if (isKnownProduct) {
              // Get metadata from _meta.ts if available
              const productDocs = docsMetadata[product] as ProductDocs;
              const indexItem = productDocs?.items?.index;
              const title =
                indexItem?.title ||
                `${product.charAt(0).toUpperCase() + product.slice(1)} Documentation`;
              // For placeholder fallback, we'll use a default welcome message
              const description = `Welcome to ${product} documentation`;

              // Generate a placeholder content with proper metadata
              content = `---
title: ${title}
description: ${description}
---

# ${title}

${description}

Get started with ${product} by exploring the documentation in the sidebar.`;

              console.log(`[getDoc] Generated fallback content for known product index`);
            } else {
              // For unknown products, use "Untitled Document" with empty content
              content = `---
title: Untitled Document
description: 
---
`;
              console.log(`[getDoc] Generated "Untitled Document" for unknown product index`);
            }

            docsCache.set("doc", filePath, content);
          } else {
            throw fetchError;
          }
        }
      }
    } catch (error) {
      console.warn(
        `[getDoc] Could not load document content for ${path}, using placeholder`,
        error
      );
      content = createPlaceholderContent(path);
    }

    // Parse frontmatter and get content
    const { frontmatter, content: cleanContent } = parseFrontmatter(content);

    // Get base metadata from _meta.ts (for structure, slug, types, etc.)
    let meta = getMetadataFromStructure(path);

    // Always use frontmatter title if available, otherwise keep the one from _meta.ts
    if (frontmatter.title) {
      meta.title = frontmatter.title;
    }

    // Always use frontmatter description as source of truth
    meta.description = frontmatter.description || "";

    console.log(`[getDoc] Final metadata:`, meta);

    return { meta, content: cleanContent };
  } catch (error) {
    // Fallback
    const meta = getMetadataFromStructure(path);
    // For fallback, we'll use an empty description since we want frontmatter to be the source of truth
    meta.description = "";

    // Create fallback content with frontmatter
    const content = `---
title: ${meta.title}
description: ${meta.description}
---

# ${meta.title}

Content not available.`;

    return { meta, content };
  }
};

// Helper function to get metadata from the structure
const getMetadataFromStructure = (path: string): DocMeta => {
  // Remove /docs/ prefix and extract path parts
  const pathParts = path
    .replace(/^\/docs\//, "")
    .split("/")
    .filter((part) => part !== "");
  console.log(`[getMetadataFromStructure] Path parts:`, pathParts);

  if (pathParts.length === 0) {
    return {
      title: "Documentation",
      description: "",
      slug: "index",
      path: "index",
      product: "",
      type: "item",
    };
  }

  const product = pathParts[0];
  const productDocs = docsMetadata[product] as ProductDocs;

  if (!productDocs) {
    // Product not found, return "Untitled Document" metadata
    return {
      title: "Untitled Document",
      description: "",
      slug: "",
      path: pathParts.join("/"),
      product,
      type: "item",
    };
  }

  // Initialize variables
  let title = "";
  let description = "";
  let docType: DocType = "item";
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
    docType = "item";
    slug = pathParts[1]; // Use the second part
    console.log(`[getMetadataFromStructure] Top-level item with trailing slash: ${slug}`);

    // Look for the metadata in top-level items
    const item = productDocs.items?.[slug];
    if (item) {
      title = item.title;
      description = ""; // Empty description, will be populated from frontmatter
      console.log(`[getMetadataFromStructure] Found item metadata:`, {
        title,
        description,
      });
    } else {
      title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
      description = ""; // Empty description, will be populated from frontmatter
      console.log(`[getMetadataFromStructure] Using default item metadata:`, {
        title,
        description,
      });
    }
    return {
      title,
      description,
      slug,
      path: pathParts.join("/"),
      product,
      type: docType,
    };
  }

  // Determine the type and extract metadata based on path structure
  if (pathParts.length === 1) {
    // Product root: /docs/mirascope/
    docType = "item";
    slug = getSlug(pathParts);

    if (slug === "index" || slug === "" || slug === "welcome" || slug === "overview") {
      // Use product index item
      const indexItem = productDocs.items?.index;
      console.log(`[getMetadataFromStructure] Checking for index item for ${product}`, indexItem);

      if (indexItem) {
        title = indexItem.title;
        description = ""; // Empty description, will be populated from frontmatter
        console.log(`[getMetadataFromStructure] Using metadata from _meta.ts for index:`, {
          title,
          description,
        });
      } else {
        title = `${product.charAt(0).toUpperCase() + product.slice(1)} Documentation`;
        description = "";
        console.log(`[getMetadataFromStructure] Using fallback metadata for index:`, {
          title,
          description,
        });
      }
    } else {
      // Regular top-level item: /docs/mirascope/migration
      const item = productDocs.items?.[slug];
      console.log(`[getMetadataFromStructure] Looking for item metadata for slug: ${slug}`, item);
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

    // First check if this is a direct top-level item like migration.mdx
    if (slug !== "index" && productDocs.items && productDocs.items[slug]) {
      // This is a direct top-level item like /docs/mirascope/migration
      docType = "item";
      const item = productDocs.items[slug];
      title = item.title;
      description = ""; // Empty description, will be populated from frontmatter
      console.log(`[getMetadataFromStructure] Found top-level item:`, {
        slug,
        title,
        description,
      });
      return {
        title,
        description,
        slug,
        path: pathParts.join("/"),
        product,
        type: docType,
      };
    }

    // Check if it's a group
    if (productDocs.groups && productDocs.groups[potentialGroupOrSection]) {
      docType = "group-item";
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
      docType = "section-item";
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
      // Unknown structure, use fallback
      docType = "item";
      title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
      description = "";
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
      docType = "section-group-item";
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
      // Unknown structure, use fallback
      docType = "item";
      title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
      description = "";
    }
  } else if (pathParts.length >= 4) {
    // Section + group + item: /docs/mirascope/api/llm/generation
    docType = "section-group-item";
    section = pathParts[1];
    group = pathParts[2];
    slug = pathParts[3];

    // Check if the structure exists
    if (
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
      // Unknown structure, use fallback
      title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
      description = "";
    }
  }

  // If title is still empty, generate one from the slug
  if (!title) {
    title = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
  }

  const meta = {
    title,
    description,
    slug,
    path: pathParts.join("/"),
    product,
    type: docType,
    section,
    group,
    sectionTitle,
    groupTitle,
  };

  return meta;
};

// (buildPath function removed since we now use the path directly)

// Helper function to create placeholder content
const createPlaceholderContent = (_path: string): string => {
  // For all cases, just return "Untitled Document" as the title with no content
  return `---
title: Untitled Document
description: 
---
`;
};

// Get all documentation for a product
export const getDocsForProduct = (product: string): DocMeta[] => {
  const productDocs = docsMetadata[product] as ProductDocs;
  if (!productDocs) {
    return [];
  }

  const docs: DocMeta[] = [];

  // Process top-level items
  Object.keys(productDocs.items).forEach((slug) => {
    const item = productDocs.items[slug];
    const path = `${product}/${slug}`;
    docs.push({
      title: item.title,
      description: "", // Empty description, will be populated from frontmatter
      slug,
      path,
      product,
      type: "item",
    });
  });

  // Process groups and their items
  Object.keys(productDocs.groups).forEach((groupSlug) => {
    const group = productDocs.groups[groupSlug];

    // Add each item in the group
    Object.keys(group.items).forEach((itemSlug) => {
      const item = group.items[itemSlug];
      const path = `${product}/${groupSlug}/${itemSlug}`;
      docs.push({
        title: item.title,
        description: "", // Empty description, will be populated from frontmatter
        slug: itemSlug,
        path,
        product,
        type: "group-item",
        group: groupSlug,
        groupTitle: group.title,
      });
    });
  });

  // Process sections
  Object.keys(productDocs.sections).forEach((sectionSlug) => {
    const section = productDocs.sections[sectionSlug];

    // Add section items
    Object.keys(section.items).forEach((itemSlug) => {
      const item = section.items[itemSlug];
      const path = `${product}/${sectionSlug}/${itemSlug}`;
      docs.push({
        title: item.title,
        description: "", // Empty description, will be populated from frontmatter
        slug: itemSlug,
        path,
        product,
        type: "section-item",
        section: sectionSlug,
        sectionTitle: section.title,
      });
    });

    // Add section groups and their items
    if (section.groups) {
      Object.keys(section.groups).forEach((groupSlug) => {
        const group = section.groups![groupSlug];

        // Add each item in the group
        Object.keys(group.items).forEach((itemSlug) => {
          const item = group.items[itemSlug];
          const path = `${product}/${sectionSlug}/${groupSlug}/${itemSlug}`;
          docs.push({
            title: item.title,
            description: "", // Empty description, will be populated from frontmatter
            slug: itemSlug,
            path,
            product,
            type: "section-group-item",
            section: sectionSlug,
            sectionTitle: section.title,
            group: groupSlug,
            groupTitle: group.title,
          });
        });
      });
    }
  });

  return docs;
};

// Get all docs for a product section
export const getDocsForSection = (product: string, section: string): DocMeta[] => {
  const allDocs = getDocsForProduct(product);
  return allDocs.filter((doc) => doc.section === section);
};

// Get all docs for a product group
export const getDocsForGroup = (product: string, group: string): DocMeta[] => {
  const allDocs = getDocsForProduct(product);
  return allDocs.filter((doc) => doc.group === group);
};

// Gets all available sections for a product
export const getSectionsForProduct = (product: string): { slug: string; title: string }[] => {
  const productDocs = docsMetadata[product] as ProductDocs;
  if (!productDocs || !productDocs.sections) {
    return [];
  }

  return Object.keys(productDocs.sections).map((sectionSlug) => ({
    slug: sectionSlug,
    title: productDocs.sections[sectionSlug].title,
  }));
};
