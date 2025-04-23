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
