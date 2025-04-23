/**
 * Documentation structure for all products
 *
 * This file defines the structure, order, and metadata for all documentation.
 *
 * We now use the DocsSpec format from src/lib/content/spec.ts as the default export.
 * A legacy-compatible version is also exported as 'meta' for backward compatibility.
 */

// Re-export legacy types for files that import from here
export * from "@/src/lib/content/legacy-doc-meta";

// Import product-specific metadata
import mirascopeSpec from "./mirascope/_meta";
import lilypadSpec from "./lilypad/_meta";

import type { ProductDocsSpec } from "@/src/lib/content/spec";
import type { DocsStructure } from "@/src/lib/content/legacy-doc-meta";
import { toLegacyFormat } from "@/src/lib/content/doc-converter";

// Build new format spec
const spec: ProductDocsSpec = {
  mirascope: mirascopeSpec,
  lilypad: lilypadSpec,
};

// Convert to legacy format for backward compatibility
export const meta: DocsStructure = toLegacyFormat(spec);

// Default export is now the new format
export default spec;
