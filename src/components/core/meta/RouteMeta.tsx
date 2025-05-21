/**
 * RouteMeta Component
 *
 * Defines page-specific metadata that changes with each route:
 * - Page title
 * - Description
 * - Open Graph/social sharing metadata
 * - Structured data
 * - Other route-specific meta tags
 */

import type { RouteMetaProps } from "./types";
import { environment } from "@/src/lib/content/environment";
import { extractMetadata, serializeMetadata } from "./utils";

export function RouteMeta({ children }: RouteMetaProps) {
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
        data-route-meta={serializedMetadata}
        style={{ display: "none" }}
        data-testid="route-meta-serialized"
      />
    );
  }

  // In client mode, just render the children directly
  // Later this will be replaced with HeadManager integration
  return <>{children}</>;
}

export default RouteMeta;
