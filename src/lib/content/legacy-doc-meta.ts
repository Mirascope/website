/**
 * LEGACY Documentation structure types
 *
 * This file contains the legacy types that were previously defined in content/doc/_meta.ts.
 * These are kept for compatibility during the migration to the new DocSpec format.
 */

// Basic item structure
export interface DocMetaItem {
  title: string;
  hasExtractableSnippets?: boolean; // Flag to indicate the doc has code snippets that should be extracted
  items?: Record<string, DocMetaItem>; // Nested items for folder-like structure
}

// Group of documents
export interface DocGroup {
  title: string;
  items: Record<string, DocMetaItem>;
}

// Section of documentation (like API)
export interface DocSection {
  title: string;
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

/**
 * Helper function to iterate through all docs in the metadata
 * @returns An array of objects with product, path, and metadata for each doc
 */
export function getAllDocs(
  meta: DocsStructure
): Array<{ product: string; path: string; meta: DocMetaItem }> {
  const allDocs: Array<{ product: string; path: string; meta: DocMetaItem }> = [];

  // Helper function to process nested items
  function processNestedItems(
    product: string,
    basePath: string,
    items: Record<string, DocMetaItem>
  ) {
    for (const [itemKey, docMeta] of Object.entries(items)) {
      const itemPath = basePath ? `${basePath}/${itemKey}` : itemKey;

      // Add the current item, unless it is a folder
      if (!docMeta.items) {
        allDocs.push({
          product,
          path: itemPath,
          meta: docMeta,
        });
      }

      // Process nested items if this is a folder
      if (docMeta.items) {
        processNestedItems(product, itemPath, docMeta.items);
      }
    }
  }

  // Loop through all products and their docs
  for (const [product, productDocs] of Object.entries(meta)) {
    // Process top-level items
    processNestedItems(product, "", productDocs.items);

    // Process items in groups
    for (const [groupKey, group] of Object.entries(productDocs.groups)) {
      for (const [itemKey, docMeta] of Object.entries(group.items)) {
        const itemPath = `${groupKey}/${itemKey}`;

        // Add the current item, unless it is a folder
        if (!docMeta.items) {
          allDocs.push({
            product,
            path: itemPath,
            meta: docMeta,
          });
        }

        // Process nested items if this is a folder
        if (docMeta.items) {
          processNestedItems(product, itemPath, docMeta.items);
        }
      }
    }

    // Process items in sections
    for (const [sectionKey, section] of Object.entries(productDocs.sections)) {
      // Direct section items
      for (const [itemKey, docMeta] of Object.entries(section.items)) {
        const itemPath = `${sectionKey}/${itemKey}`;

        // Add the current item, unless it is a folder
        if (!docMeta.items) {
          allDocs.push({
            product,
            path: itemPath,
            meta: docMeta,
          });
        }

        // Process nested items if this is a folder
        if (docMeta.items) {
          processNestedItems(product, itemPath, docMeta.items);
        }
      }

      // Items in section groups
      if (section.groups) {
        for (const [groupKey, group] of Object.entries(section.groups)) {
          for (const [itemKey, docMeta] of Object.entries(group.items)) {
            const itemPath = `${sectionKey}/${groupKey}/${itemKey}`;

            // Add the current item, unless it is a folder
            if (!docMeta.items) {
              allDocs.push({
                product,
                path: itemPath,
                meta: docMeta,
              });
            }

            // Process nested items if this is a folder
            if (docMeta.items) {
              processNestedItems(product, itemPath, docMeta.items);
            }
          }
        }
      }
    }
  }

  return allDocs;
}
