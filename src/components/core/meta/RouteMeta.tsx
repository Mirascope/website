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

import { useEffect } from "react";
import type { RouteMetaProps } from "./types";
import { environment } from "@/src/lib/content/environment";
import { extractMetadata, serializeMetadata } from "./utils";
import { HeadManager } from "./HeadManager";

export function RouteMeta({ children }: RouteMetaProps) {
  // In prerendering mode, we only output a hidden div with serialized metadata
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

  // In client mode, register with HeadManager
  useEffect(() => {
    if (typeof document !== "undefined") {
      const metadata = extractMetadata(children);
      HeadManager.update("route", metadata);
    }
  }, [children]);

  // Don't render anything in the DOM
  return null;
}

export default RouteMeta;
