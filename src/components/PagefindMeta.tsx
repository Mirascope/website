import { type ReactNode } from "react";

interface PagefindMetaProps {
  title: string;
  description: string;
  children: ReactNode;
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
 */
export function PagefindMeta({ title, description, children }: PagefindMetaProps) {
  // Use ref to modify the DOM after render to get a pure data-pagefind-body attribute
  // without any value (not ="true" or ="")
  return (
    <div data-pagefind-body>
      <>
        <div style={{ display: "none" }}>
          <h1 data-pagefind-meta="title">{title}</h1>
          <p data-pagefind-weight="7">{title}</p>
          <p data-pagefind-weight="4">{description}</p>
        </div>
      </>
      <div data-pagefind-weight="1">{children}</div>
    </div>
  );
}

export default PagefindMeta;
