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

import type { BaseMetaProps } from "./types";
import { environment } from "@/src/lib/content/environment";
import { extractMetadata, serializeMetadata } from "./utils";

export function BaseMeta({ children }: BaseMetaProps) {
  // In prerendering mode, we only output a hidden div with serialized metadata
  // In client mode, we render the children directly (for now)
  // Later, we'll integrate with HeadManager

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

  // In client mode, just render the children directly
  // Later this will be replaced with HeadManager integration
  return <>{children}</>;
}

export default BaseMeta;
