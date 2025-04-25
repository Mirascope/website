import { type ReactNode } from "react";

interface PagefindMetaProps {
  title?: string;
  children: ReactNode;
}

/**
 * PagefindMeta wraps content and adds metadata for Pagefind indexing.
 *
 * Uses the syntax: <meta data-pagefind-meta="key:value" />
 * All metadata is placed inside the data-pagefind-body div, which makes it
 * easier to add more metadata properties in the future.
 */
export function PagefindMeta({ title, children }: PagefindMetaProps) {
  return (
    <div data-pagefind-body>
      {title && <meta data-pagefind-meta={`title:${title}`} />}
      {children}
    </div>
  );
}

export default PagefindMeta;
