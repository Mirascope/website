import { type ReactNode } from "react";

interface PagefindMetaProps {
  title: string;
  description: string;
  children: ReactNode;
  section?: string;
  searchWeight?: number;
}

function clampWeight(x: number) {
  return Math.max(0, Math.min(x, 10));
}

/**
 * PagefindMeta wraps content and adds metadata for Pagefind indexing.
 *
 * Uses the syntax: <meta data-pagefind-meta="key:value" />
 * All metadata is placed inside the data-pagefind-body div, which makes it
 * easier to add more metadata properties in the future.
 *
 * The description is added with a higher weight (4) to make it more important
 * in search results, as per https://pagefind.app/docs/weighting/
 *
 * The section parameter can be used to track hierarchy (e.g., "docs>mirascope>learn")
 * The sectionWeight parameter applies a multiplier to all weights for section-based boosting
 */
export function PagefindMeta({ children, searchWeight = 1.0 }: PagefindMetaProps) {
  // Calculate effective weights with section multiplier
  const contentWeight = clampWeight(searchWeight);

  return (
    <div data-pagefind-body>
      <div data-pagefind-weight={contentWeight}>{children}</div>
    </div>
  );
}

export default PagefindMeta;
