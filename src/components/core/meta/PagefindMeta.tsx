import { type ReactNode } from "react";

interface PagefindMetaProps {
  title: string;
  description: string;
  children: ReactNode;
  section?: string;
}

const TITLE_WEIGHT = 4;
const DESCRIPTION_WEIGHT = 3;

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
export function PagefindMeta({ children, title, description }: PagefindMetaProps) {
  return (
    <div data-pagefind-body>
      {children}
      <div style={{ display: "none" }}>
        <div data-pagefind-weight={TITLE_WEIGHT}>{title}</div>
        <div data-pagefind-weight={DESCRIPTION_WEIGHT}>{description}</div>
      </div>
    </div>
  );
}

export default PagefindMeta;
