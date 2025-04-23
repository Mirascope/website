/**
 * Helper script to convert between the legacy and new doc metadata formats
 */

import type { DocsSpec } from "./spec";
import type { DocsStructure } from "./legacy-doc-meta";
import { convertLegacyToDocs, convertDocsToLegacy } from "./spec-converter";

/**
 * Convert meta to new format
 */
export function toNewFormat(meta: DocsStructure): DocsSpec {
  return convertLegacyToDocs(meta);
}

/**
 * Convert new format to legacy format
 */
export function toLegacyFormat(docsSpec: DocsSpec): DocsStructure {
  return convertDocsToLegacy(docsSpec);
}
