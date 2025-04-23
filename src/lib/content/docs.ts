import { loadContent } from "./content-loader";
import type { FutureDocMeta, DocMeta, DocContent, FutureDocContent } from "./content-types";
import { getMetadataFromStructure, mergeMetadata } from "./metadata-service";

// Re-export type definitions
export type { DocMeta, DocContent, FutureDocMeta };

// Import product docs metadata (both formats)
import { meta as docsMetadata } from "@/content/doc/_meta";
import docsSpec from "@/content/doc/_meta";
import type { ProductDocs, DocMetaItem } from "@/src/lib/content/legacy-doc-meta";
import type { DocSpec } from "@/src/lib/content/spec";

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

function createFutureDocMeta(frontmatter: Record<string, any>, path: string): FutureDocMeta {
  const allDocs = getDocsFromSpec();
  const docMeta = allDocs.find((doc) => doc.path === path);
  if (!docMeta) {
    throw new Error(`Doc not found for path: ${path}`);
  }
  // Create basic frontmatter metadata
  const frontmatterMeta = {
    title: frontmatter.title,
    description: frontmatter.description,
    // Other frontmatter fields can be added here
  };
  // Merge metadata (frontmatter takes precedence)
  return mergeMetadata(docMeta, frontmatterMeta) as FutureDocMeta;
}

/**
 * Get doc content by path
 */
export async function getDoc(path: string): Promise<DocContent> {
  return loadContent<DocMeta>(path, "doc", createDocMeta);
}

export async function futureGetDoc(path: string): Promise<FutureDocContent> {
  return loadContent<FutureDocMeta>(path, "doc", createFutureDocMeta);
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

    /**
     * Helper function to process nested items recursively
     */
    function processNestedItems(
      item: DocMetaItem,
      itemPath: string,
      itemSlug: string,
      meta: {
        section?: string;
        sectionTitle?: string;
        group?: string;
        groupTitle?: string;
      }
    ) {
      // Add the current item
      docs.push({
        title: item.title,
        description: "", // Empty description, will be populated from frontmatter
        slug: itemSlug,
        path: itemPath,
        product,
        type: "doc",
        ...meta,
      });

      // Process nested items if they exist
      if (item.items) {
        Object.keys(item.items).forEach((childSlug) => {
          const childItem = item.items![childSlug];
          const childPath = `${itemPath}/${childSlug}`;

          processNestedItems(childItem, childPath, childSlug, meta);
        });
      }
    }

    // Process top-level items
    if (productDocs.items) {
      Object.keys(productDocs.items).forEach((slug) => {
        const item = productDocs.items![slug];
        const path = `${product}/${slug}`;

        processNestedItems(
          item,
          path,
          slug,
          {} // No section or group metadata
        );
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

            processNestedItems(item, path, itemSlug, {
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

            processNestedItems(item, path, itemSlug, {
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

                processNestedItems(item, path, itemSlug, {
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

/**
 * Process a doc specification and build FutureDocMeta items
 * @param docSpec Doc specification
 * @param product Product this doc belongs to
 * @param pathPrefix Base path for this doc
 * @returns Array of FutureDocMeta items from this doc and its children
 */
function processDocSpec(
  docSpec: DocSpec,
  product: string,
  pathPrefix: string = ""
): FutureDocMeta[] {
  const result: FutureDocMeta[] = [];

  // Build the path for this doc
  const docPath = pathPrefix ? `${pathPrefix}/${docSpec.slug}` : `${product}/${docSpec.slug}`;

  // Add this doc to the result if it's a page (has content)
  if (!docSpec.hasNoContent) {
    result.push({
      title: docSpec.label,
      description: "", // Will be populated from frontmatter later
      slug: docSpec.slug,
      path: docPath,
      type: "doc",
      product,
      hasExtractableSnippets: docSpec.hasExtractableSnippets || false,
    });
  }

  // Process children recursively
  if (docSpec.children && docSpec.children.length > 0) {
    docSpec.children.forEach((childSpec) => {
      const childItems = processDocSpec(childSpec, product, docPath);
      result.push(...childItems);
    });
  }

  return result;
}

/**
 * Get all docs metadata using the new spec format
 * Processes the ProductDocsSpec and returns FutureDocMeta items
 * @returns Array of FutureDocMeta for all products and docs
 */
export function getDocsFromSpec(): FutureDocMeta[] {
  const allDocs: FutureDocMeta[] = [];

  // Process each product in the spec
  Object.entries(docsSpec).forEach(([product, productSpec]) => {
    // Process default section items
    productSpec.defaultSection.forEach((docSpec) => {
      const docItems = processDocSpec(docSpec, product);
      allDocs.push(...docItems);
    });

    // Process additional sections
    productSpec.sections.forEach((section) => {
      section.children.forEach((docSpec) => {
        // Process with section path prefix and section slug
        const sectionPathPrefix = `${product}/${section.slug}`;
        const docItems = processDocSpec(docSpec, product, sectionPathPrefix);
        allDocs.push(...docItems);
      });
    });
  });

  return allDocs;
}
