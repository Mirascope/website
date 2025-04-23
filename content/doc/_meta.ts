/**
 * Documentation structure for all products
 *
 * This file defines the structure, order, and metadata for all documentation.
 *
 * We now use the DocSpec format from src/lib/content/spec.ts and convert
 * it to the legacy format for compatibility with the rest of the codebase.
 */

// Re-export legacy types for files that import from here
export * from "@/src/lib/content/legacy-doc-meta";

// Import new spec types are commented out until we start using them
// import type { DocsSpec, ProductSpec } from "@/src/lib/content/spec";

// Import converter will be used once we migrate to the new format
// import { toLegacyFormat } from "@/src/lib/content/doc-converter";

// Import product-specific metadata
import mirascopeMeta from "./mirascope/_meta";
import lilypadMeta from "./lilypad/_meta";

// Define the metadata in the legacy format (for now)
// Later this will be migrated to the new format
import type { DocsStructure } from "@/src/lib/content/legacy-doc-meta";

const meta: DocsStructure = {
  mirascope: mirascopeMeta,
  lilypad: lilypadMeta,
};

// Later this will be:
// const newMeta: DocsSpec = {
//   // New format definition
// };
// const meta: DocsStructure = toLegacyFormat(newMeta);

// Import the getAllDocs function directly
import { getAllDocs as getLegacyDocs } from "@/src/lib/content/legacy-doc-meta";

export function getAllDocs(): Array<{ product: string; path: string; meta: any }> {
  // Delegate to the implementation in legacy-doc-meta.ts
  return getLegacyDocs(meta);
}

export default meta;
