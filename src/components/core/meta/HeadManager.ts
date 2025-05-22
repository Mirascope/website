/**
 * HeadManager
 *
 * A simple client-side manager for document head updates based on metadata.
 * Manages both base (site-wide) and route (page-specific) metadata.
 */

import type { RawMetadata, UnifiedMetadata } from "./types";
import { unifyMetadata } from "./utils";
import { createMetadataElements } from "./renderer";

// Simple module-level state
let baseMetadata: RawMetadata | null = null;
let routeMetadata: RawMetadata | null = null;

// Types for update source
type MetadataSource = "base" | "route";

/**
 * Updates metadata from either base or route source
 * Then attempts to unify and update the document head
 */
function update(source: MetadataSource, metadata: RawMetadata): void {
  // Skip if not in browser
  if (typeof document === "undefined") return;

  // Update the appropriate metadata store
  if (source === "base") {
    baseMetadata = metadata;
  } else {
    routeMetadata = metadata;
  }

  // Try to create unified metadata if we have both pieces
  if (baseMetadata && routeMetadata) {
    try {
      const unified = unifyMetadata(baseMetadata, routeMetadata);
      updateDocumentHead(unified);
    } catch (error) {
      console.error("Failed to unify metadata:", error);
    }
  }
}

/**
 * Updates the document head with unified metadata
 * Uses data-head-manager attribute to track managed elements
 */
function updateDocumentHead(metadata: UnifiedMetadata): void {
  // Remove all existing managed elements using the data attribute
  document.querySelectorAll('[data-head-manager="true"]').forEach((element) => {
    element.parentNode?.removeChild(element);
  });

  // Create new DOM elements (already includes data-head-manager attribute)
  const elements = createMetadataElements(metadata);

  // Update document title
  document.title = metadata.title;

  // Add meta tags
  elements.meta.forEach((element) => {
    document.head.appendChild(element);
  });

  // Add link tags
  elements.link.forEach((element) => {
    document.head.appendChild(element);
  });
}

export const HeadManager = {
  update,
  // For testing and debugging
  getState: () => ({ baseMetadata, routeMetadata }),
};
