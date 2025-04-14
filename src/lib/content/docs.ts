import { docContentHandler } from "./handlers/doc-content-handler";
import { useContent } from "./hooks/useContent";
import type { DocMeta } from "./content-types";
import type { ContentResult, Content } from "./hooks/useContent";

// Define a DocContent type based on the Content interface
export type DocContent = Content<DocMeta>;

/**
 * Hook for loading and rendering a documentation page
 */
export function useDoc(path: string): ContentResult<DocMeta> {
  return useContent<DocMeta>(path, docContentHandler);
}

/**
 * Get a documentation page by path
 */
export function getDoc(path: string) {
  return docContentHandler.getDocument(path);
}

/**
 * Get all documentation pages for a product
 */
export function getDocsForProduct(product: string) {
  return docContentHandler.getDocsForProduct(product);
}

/**
 * Get documentation pages for a specific section
 */
export function getDocsForSection(product: string, section: string) {
  return docContentHandler.getDocsForSection(product, section);
}

/**
 * Get documentation pages for a specific group
 */
export function getDocsForGroup(product: string, group: string) {
  return docContentHandler.getDocsForGroup(product, group);
}

/**
 * Get sections for a product
 */
export function getSectionsForProduct(product: string) {
  return docContentHandler.getSectionsForProduct(product);
}

// Re-export doc types
export type { DocMeta };
