/**
 * Documentation structure for all products
 *
 * This file defines the structure, order, and metadata for all documentation.
 *
 * Structure:
 * - Top-level keys are product names (mirascope, lilypad)
 * - Each product contains:
 *   - items: Top-level documents
 *   - groups: Organized groups of documents
 *   - sections: Major sections like "API"
 */

// Basic item structure
export interface DocMetaItem {
  title: string;
  hasExtractableSnippets?: boolean; // Flag to indicate the doc has code snippets that should be extracted
}

// Group of documents
export interface DocGroup {
  title: string;
  items: Record<string, DocMetaItem>;
}

// Section of documentation (like API)
export interface DocSection {
  title: string;
  defaultSlug?: string;
  items: Record<string, DocMetaItem>; // Direct section items
  groups?: Record<string, DocGroup>; // Grouped section items
}

// Product documentation
export interface ProductDocs {
  items: Record<string, DocMetaItem>; // Top-level items
  groups: Record<string, DocGroup>; // Grouped items
  sections: Record<string, DocSection>; // Sections (like API)
}

// Overall docs structure
export interface DocsStructure {
  [product: string]: ProductDocs;
}

// Import product-specific metadata
import mirascopeMeta from "./mirascope/_meta";
import lilypadMeta from "./lilypad/_meta";

const meta: DocsStructure = {
  mirascope: mirascopeMeta,
  lilypad: lilypadMeta,
};

/**
 * Helper function to iterate through all docs in the metadata
 * @returns An array of objects with product, path, and metadata for each doc
 */
export function getAllDocs(): Array<{ product: string; path: string; meta: DocMetaItem }> {
  const allDocs: Array<{ product: string; path: string; meta: DocMetaItem }> = [];

  // Loop through all products and their docs
  for (const [product, productDocs] of Object.entries(meta)) {
    // Process top-level items
    for (const [key, docMeta] of Object.entries(productDocs.items)) {
      allDocs.push({
        product,
        path: key,
        meta: docMeta,
      });
    }

    // Process items in groups
    for (const [groupKey, group] of Object.entries(productDocs.groups)) {
      for (const [itemKey, docMeta] of Object.entries(group.items)) {
        allDocs.push({
          product,
          path: `${groupKey}/${itemKey}`,
          meta: docMeta,
        });
      }
    }

    // Process items in sections
    for (const [sectionKey, section] of Object.entries(productDocs.sections)) {
      // Direct section items
      for (const [itemKey, docMeta] of Object.entries(section.items)) {
        allDocs.push({
          product,
          path: `${sectionKey}/${itemKey}`,
          meta: docMeta,
        });
      }

      // Items in section groups
      if (section.groups) {
        for (const [groupKey, group] of Object.entries(section.groups)) {
          for (const [itemKey, docMeta] of Object.entries(group.items)) {
            allDocs.push({
              product,
              path: `${sectionKey}/${groupKey}/${itemKey}`,
              meta: docMeta,
            });
          }
        }
      }
    }
  }

  return allDocs;
}

export default meta;
