import { useContent } from "./useContent";
import { loadContent } from "./content-loader";
import type { ContentMeta, Content, ContentResult } from "./types";
import { getMetadataFromStructure, mergeMetadata } from "./metadata-service";

// Import product docs metadata
import docsMetadata from "@/docs/_meta";
import type { ProductDocs } from "@/docs/_meta";

// Define doc-specific metadata
export interface DocMeta extends ContentMeta {
  product: string;
  section?: string;
  group?: string;
  sectionTitle?: string;
  groupTitle?: string;
}

// Define doc-specific content type
export type DocContent = Content<DocMeta>;

/**
 * Create metadata from frontmatter for docs
 */
function createDocMeta(frontmatter: Record<string, any>, path: string): DocMeta {
  // Get metadata from structure definitions
  const structureMeta = getMetadataFromStructure(path, "doc");

  // Create basic frontmatter metadata
  const frontmatterMeta = {
    title: frontmatter.title,
    description: frontmatter.description,
    // Other frontmatter fields can be added here
  };

  // Merge metadata (frontmatter takes precedence)
  return mergeMetadata(structureMeta, frontmatterMeta) as DocMeta;
}

/**
 * Get doc content by path
 */
export async function getDocContent(path: string): Promise<DocContent> {
  return loadContent<DocMeta>(path, "doc", createDocMeta);
}

/**
 * Hook for loading and rendering a documentation page
 */
export function useDoc(path: string): ContentResult<DocMeta> {
  return useContent<DocMeta>(path, getDocContent);
}

/**
 * Get a documentation page by path
 */
export function getDoc(path: string): Promise<DocContent> {
  return getDocContent(path);
}

/**
 * Get all documentation pages metadata
 */
export async function getAllDocMeta(): Promise<DocMeta[]> {
  // Build a list of all products
  const products = Object.keys(docsMetadata);

  // Get docs for each product
  const allDocs: DocMeta[] = [];

  for (const product of products) {
    const productDocs = getDocsForProduct(product);
    allDocs.push(...(await productDocs));
  }

  return allDocs;
}

/**
 * Get all documentation pages for a product
 */
export function getDocsForProduct(product: string): Promise<DocMeta[]> {
  try {
    const productDocs = docsMetadata[product] as ProductDocs;
    if (!productDocs) {
      return Promise.resolve([]);
    }

    const docs: DocMeta[] = [];

    // Process top-level items
    if (productDocs.items) {
      Object.keys(productDocs.items).forEach((slug) => {
        const item = productDocs.items![slug];
        const path = `${product}/${slug}`;
        docs.push({
          title: item.title,
          description: "", // Empty description, will be populated from frontmatter
          slug,
          path,
          product,
          type: "doc",
        });
      });
    }

    // Process groups and their items
    if (productDocs.groups) {
      Object.keys(productDocs.groups).forEach((groupSlug) => {
        const group = productDocs.groups![groupSlug];

        // Add each item in the group
        if (group.items) {
          Object.keys(group.items).forEach((itemSlug) => {
            const item = group.items![itemSlug];
            const path = `${product}/${groupSlug}/${itemSlug}`;
            docs.push({
              title: item.title,
              description: "", // Empty description, will be populated from frontmatter
              slug: itemSlug,
              path,
              product,
              type: "doc",
              group: groupSlug,
              groupTitle: group.title,
            });
          });
        }
      });
    }

    // Process sections
    if (productDocs.sections) {
      Object.keys(productDocs.sections).forEach((sectionSlug) => {
        const section = productDocs.sections![sectionSlug];

        // Add section items
        if (section.items) {
          Object.keys(section.items).forEach((itemSlug) => {
            const item = section.items![itemSlug];
            const path = `${product}/${sectionSlug}/${itemSlug}`;
            docs.push({
              title: item.title,
              description: "", // Empty description, will be populated from frontmatter
              slug: itemSlug,
              path,
              product,
              type: "doc",
              section: sectionSlug,
              sectionTitle: section.title,
            });
          });
        }

        // Add section groups and their items
        if (section.groups) {
          Object.keys(section.groups).forEach((groupSlug) => {
            const group = section.groups![groupSlug];

            // Add each item in the group
            if (group.items) {
              Object.keys(group.items).forEach((itemSlug) => {
                const item = group.items![itemSlug];
                const path = `${product}/${sectionSlug}/${groupSlug}/${itemSlug}`;
                docs.push({
                  title: item.title,
                  description: "", // Empty description, will be populated from frontmatter
                  slug: itemSlug,
                  path,
                  product,
                  type: "doc",
                  section: sectionSlug,
                  sectionTitle: section.title,
                  group: groupSlug,
                  groupTitle: group.title,
                });
              });
            }
          });
        }
      });
    }

    return Promise.resolve(docs);
  } catch (error) {
    console.error(`Failed to get documents for product ${product}:`, error);
    return Promise.resolve([]);
  }
}

/**
 * Get documentation pages for a specific section
 */
export async function getDocsForSection(product: string, section: string): Promise<DocMeta[]> {
  const allDocs = await getDocsForProduct(product);
  return allDocs.filter((doc) => doc.section === section);
}

/**
 * Get documentation pages for a specific group
 */
export async function getDocsForGroup(product: string, group: string): Promise<DocMeta[]> {
  const allDocs = await getDocsForProduct(product);
  return allDocs.filter((doc) => doc.group === group);
}

/**
 * Get sections for a product
 */
export function getSectionsForProduct(product: string): { slug: string; title: string }[] {
  const productDocs = docsMetadata[product] as ProductDocs;
  if (!productDocs || !productDocs.sections) {
    return [];
  }

  return Object.keys(productDocs.sections).map((sectionSlug) => ({
    slug: sectionSlug,
    title: productDocs.sections[sectionSlug].title,
  }));
}
