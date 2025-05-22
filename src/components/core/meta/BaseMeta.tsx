/**
 * BaseMeta Component
 *
 * Defines site-wide metadata that remains consistent across all pages:
 * - Character encoding, viewport settings
 * - Favicon definitions
 * - Font preloading
 * - Web manifest links
 * - Other global meta tags
 */

import { useEffect } from "react";
import type { BaseMetaProps } from "./types";
import { environment } from "@/src/lib/content/environment";
import { extractMetadata, serializeMetadata } from "./utils";
import { HeadManager } from "./HeadManager";

export function BaseMeta({ children }: BaseMetaProps) {
  // In prerendering mode, we only output a hidden div with serialized metadata
  if (environment.isPrerendering) {
    // Extract metadata
    const metadata = extractMetadata(children);

    // Serialize metadata for extraction during build
    const serializedMetadata = serializeMetadata(metadata);

    return (
      // Only output a hidden div with serialized metadata during prerendering
      <div
        data-base-meta={serializedMetadata}
        style={{ display: "none" }}
        data-testid="base-meta-serialized"
      />
    );
  }

  // In client mode, register with HeadManager
  useEffect(() => {
    if (typeof document !== "undefined") {
      const metadata = extractMetadata(children);
      HeadManager.update("base", metadata);
    }
  }, [children]);

  // Don't render anything in the DOM
  return null;
}

export default BaseMeta;
