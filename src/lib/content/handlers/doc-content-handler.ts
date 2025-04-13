import type { DocMeta } from "@/lib/content/content-types";
import { ContentLoader } from "@/lib/content/content-loader";
import { ContentCache } from "@/lib/content/content-cache";
import { BaseContentHandler } from "./base-content-handler";
import { ContentError } from "@/lib/content/errors";
import { getMetadataFromStructure, mergeMetadata } from "@/lib/content/metadata-service";

// Import product docs metadata
import docsMetadata from "@/docs/_meta";
import type { ProductDocs } from "@/docs/_meta";

/**
 * Handler for documentation content
 */
export class DocContentHandler extends BaseContentHandler<DocMeta> {
  /**
   * Creates a new DocContentHandler
   *
   * @param loader - Content loader instance
   * @param cache - Optional cache instance
   */
  constructor(loader?: ContentLoader, cache?: ContentCache) {
    super("doc", loader, cache);
  }

  /**
   * Creates metadata from frontmatter
   * For docs, we need to merge structure metadata with frontmatter
   */
  protected createMetaFromFrontmatter(frontmatter: Record<string, any>, path: string): DocMeta {
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
   * Gets a cache key for doc documents
   */
  protected getCacheKey(path: string): string {
    return `doc:${path}`;
  }

  /**
   * Gets all documentation for all products
   */
  async getAllDocuments(filter?: (meta: DocMeta) => boolean): Promise<DocMeta[]> {
    try {
      // Check cache first
      const cacheKey = "all-docs";
      if (this.cache) {
        const cached = this.cache.get(this.contentType, cacheKey);
        if (cached) {
          const docs = JSON.parse(cached) as DocMeta[];
          return filter ? docs.filter(filter) : docs;
        }
      }

      // Build a list of all products
      const products = Object.keys(docsMetadata);

      // Get docs for each product
      const allDocs: DocMeta[] = [];

      for (const product of products) {
        const productDocs = this.getDocsForProduct(product);
        allDocs.push(...productDocs);
      }

      // Cache the results
      if (this.cache) {
        this.cache.set(this.contentType, cacheKey, JSON.stringify(allDocs));
      }

      // Apply filter if provided
      return filter ? allDocs.filter(filter) : allDocs;
    } catch (error) {
      throw new ContentError(
        `Failed to get all documents: ${error instanceof Error ? error.message : String(error)}`,
        this.contentType,
        undefined
      );
    }
  }

  /**
   * Gets documents for a specific product
   */
  async getDocumentsForCollection(product: string): Promise<DocMeta[]> {
    try {
      // Check cache first
      const cacheKey = `product:${product}`;
      if (this.cache) {
        const cached = this.cache.get(this.contentType, cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const docs = this.getDocsForProduct(product);

      // Cache the results
      if (this.cache) {
        this.cache.set(this.contentType, cacheKey, JSON.stringify(docs));
      }

      return docs;
    } catch (error) {
      throw new ContentError(
        `Failed to get documents for product ${product}: ${error instanceof Error ? error.message : String(error)}`,
        this.contentType,
        undefined
      );
    }
  }

  /**
   * Gets all documentation for a specific section
   */
  async getDocsForSection(product: string, section: string): Promise<DocMeta[]> {
    const allDocs = await this.getDocumentsForCollection(product);
    return allDocs.filter((doc) => doc.section === section);
  }

  /**
   * Gets all documentation for a specific group
   */
  async getDocsForGroup(product: string, group: string): Promise<DocMeta[]> {
    const allDocs = await this.getDocumentsForCollection(product);
    return allDocs.filter((doc) => doc.group === group);
  }

  /**
   * Gets all available sections for a product
   */
  getSectionsForProduct(product: string): { slug: string; title: string }[] {
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
   * Gets all documentation for a specific product
   * (Adapted from getDocsForProduct in docs.ts)
   */
  getDocsForProduct(product: string): DocMeta[] {
    const productDocs = docsMetadata[product] as ProductDocs;
    if (!productDocs) {
      return [];
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

    return docs;
  }
}

/**
 * Factory function for creating a DocContentHandler
 */
export function createDocContentHandler(
  loader?: ContentLoader,
  cache?: ContentCache
): DocContentHandler {
  return new DocContentHandler(loader, cache);
}

// Create a default singleton instance that can be used throughout the application
export const docContentHandler = createDocContentHandler();
