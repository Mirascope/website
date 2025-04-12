// Import the centralized meta file
import docsMetadata from "../docs/_meta";
import type { ProductDocs } from "../docs/_meta";
import { docsAPI } from "./utils";
import { parseFrontmatter } from "./content/frontmatter";
import { normalizePath, getContentPath, isValidPath } from "./content/path-resolver";
import {
  getMetadataFromStructure,
  extractMetadataFromFrontmatter,
  mergeMetadata,
} from "./content/metadata-service";
import { DocumentNotFoundError } from "./content/errors";

// Check if we're in production environment
const isProduction = import.meta.env.PROD;

// Import and re-export DocMeta type from content-types
import type { DocMeta, ContentType } from "./content/content-types";
// Re-export DocMeta so other components can still import it from docs.ts
export type { DocMeta };

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

    // Normalize the path but we no longer need to extract path parts separately
    // since that's now handled by the metadata service

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
              // For unknown products, throw an error
              throw new DocumentNotFoundError("doc", path);
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
    const structureMeta = getMetadataFromStructure(path, "doc");

    // Extract metadata from frontmatter
    const frontmatterMeta = extractMetadataFromFrontmatter(frontmatter, "doc", path);

    // Merge the two metadata sources and cast to DocMeta (both metadata objects have doc type)
    const meta = mergeMetadata(structureMeta, frontmatterMeta) as DocMeta;

    console.log(`[getDoc] Final metadata:`, meta);

    return { meta, content: cleanContent };
  } catch (error) {
    // Log the error but always rethrow
    console.error("[getDoc] Error fetching document:", error);

    // If it's already a DocumentNotFoundError, just throw it
    if (error instanceof DocumentNotFoundError) {
      throw error;
    }

    // Otherwise, convert to a DocumentNotFoundError
    throw new DocumentNotFoundError("doc", path);
  }
};

// The getMetadataFromStructure function has been removed.
// Now using the version from metadata-service.ts

// (buildPath function removed since we now use the path directly)

// Helper function that throws instead of creating placeholder content
const createPlaceholderContent = (path: string): never => {
  throw new DocumentNotFoundError("doc", path);
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
      type: "doc" as ContentType,
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
        type: "doc" as ContentType,
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
        type: "doc" as ContentType,
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
            type: "doc" as ContentType,
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
