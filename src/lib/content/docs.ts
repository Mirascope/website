import { ContentLoader, createContentLoader } from "./content-loader";
import { ContentCache, createContentCache } from "./content-cache";
import { useContent } from "./useContent";
import { loadContent } from "./utils";
import type { ContentMeta, Content, ContentResult, GetContentFn, ContentHandler } from "./types";
import { ContentError } from "./errors";
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
 * Docs content handler implementation
 */
class DocHandler implements ContentHandler<DocMeta> {
  private loader: ContentLoader;
  private cache: ContentCache;
  private contentType: "doc" = "doc";

  constructor(loader?: ContentLoader, cache?: ContentCache) {
    this.loader = loader || createContentLoader({ cache });
    this.cache = cache || createContentCache();
  }

  /**
   * Get doc content by path
   */
  async getContent(path: string): Promise<DocContent> {
    return loadContent<DocMeta>(path, this.contentType, this.loader, this.cache, this.createMeta);
  }

  /**
   * Get all doc metadata
   */
  async getAllMeta(): Promise<DocMeta[]> {
    try {
      // Check cache first
      const cacheKey = "all-docs";
      const cached = this.cache.get(this.contentType, cacheKey);
      if (cached) {
        return JSON.parse(cached) as DocMeta[];
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
      this.cache.set(this.contentType, cacheKey, JSON.stringify(allDocs));

      return allDocs;
    } catch (error) {
      throw new ContentError(
        `Failed to get all documents: ${error instanceof Error ? error.message : String(error)}`,
        this.contentType,
        undefined
      );
    }
  }

  /**
   * Create metadata from frontmatter
   */
  private createMeta = (frontmatter: Record<string, any>, path: string): DocMeta => {
    // Get metadata from structure definitions
    const structureMeta = getMetadataFromStructure(path, this.contentType);

    // Create basic frontmatter metadata
    const frontmatterMeta = {
      title: frontmatter.title,
      description: frontmatter.description,
      // Other frontmatter fields can be added here
    };

    // Merge metadata (frontmatter takes precedence)
    return mergeMetadata(structureMeta, frontmatterMeta) as DocMeta;
  };

  /**
   * Get documents for a specific product
   */
  getDocsForProduct(product: string): DocMeta[] {
    try {
      // Check cache first
      const cacheKey = `product:${product}`;
      const cached = this.cache.get(this.contentType, cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

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

      // Cache the results
      this.cache.set(this.contentType, cacheKey, JSON.stringify(docs));

      return docs;
    } catch (error) {
      console.error(`Failed to get documents for product ${product}:`, error);
      return [];
    }
  }

  /**
   * Get documentation pages for a specific section
   */
  async getDocsForSection(product: string, section: string): Promise<DocMeta[]> {
    const allDocs = this.getDocsForProduct(product);
    return allDocs.filter((doc) => doc.section === section);
  }

  /**
   * Get documentation pages for a specific group
   */
  async getDocsForGroup(product: string, group: string): Promise<DocMeta[]> {
    const allDocs = this.getDocsForProduct(product);
    return allDocs.filter((doc) => doc.group === group);
  }

  /**
   * Get sections for a product
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
}

// Create a singleton instance
const docHandler = new DocHandler();

/**
 * Get doc content by path
 */
export const getDocContent: GetContentFn<DocMeta> = (path: string): Promise<DocContent> => {
  return docHandler.getContent(path);
};

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
  return docHandler.getContent(path);
}

/**
 * Get all doc metadata
 */
export function getAllDocMeta(): Promise<DocMeta[]> {
  return docHandler.getAllMeta();
}

/**
 * Get all documentation pages for a product
 */
export function getDocsForProduct(product: string): Promise<DocMeta[]> {
  return Promise.resolve(docHandler.getDocsForProduct(product));
}

/**
 * Get documentation pages for a specific section
 */
export function getDocsForSection(product: string, section: string): Promise<DocMeta[]> {
  return docHandler.getDocsForSection(product, section);
}

/**
 * Get documentation pages for a specific group
 */
export function getDocsForGroup(product: string, group: string): Promise<DocMeta[]> {
  return docHandler.getDocsForGroup(product, group);
}

/**
 * Get sections for a product
 */
export function getSectionsForProduct(product: string): { slug: string; title: string }[] {
  return docHandler.getSectionsForProduct(product);
}
