import { type ReactNode } from "react";

interface PagefindMetaProps {
  title?: string;
  description?: string;
  section?: string;
  image?: string;
  tags?: string[];
  children: ReactNode;
}

/**
 * PagefindMeta wraps content and adds metadata attributes for Pagefind indexing.
 *
 * Wrap page content with this component to:
 * 1. Index only relevant content (not navigation, sidebars, etc.)
 * 2. Attach metadata for improved search results
 */
export function PagefindMeta({
  title,
  description,
  section,
  image,
  tags = [],
  children,
}: PagefindMetaProps) {
  // Build metadata attributes
  let metaAttributes: Record<string, string> = {};

  // Add standard metadata
  if (title) metaAttributes["data-pagefind-meta"] = `title:${title}`;

  // Build additional metadata as needed
  const additionalMeta = [];
  if (description) additionalMeta.push(`description:${description}`);
  if (section) additionalMeta.push(`section:${section}`);
  if (image) additionalMeta.push(`image:${image}`);

  // Add tags as separate metadata items
  tags.forEach((tag) => {
    additionalMeta.push(`tag:${tag}`);
  });

  // If we already have a title and additional metadata, append with comma
  if (title && additionalMeta.length > 0) {
    metaAttributes["data-pagefind-meta"] += `, ${additionalMeta.join(", ")}`;
  }
  // Otherwise just set the additional metadata if there is any
  else if (additionalMeta.length > 0) {
    metaAttributes["data-pagefind-meta"] = additionalMeta.join(", ");
  }

  return (
    <div data-pagefind-body {...metaAttributes}>
      {children}
    </div>
  );
}

export default PagefindMeta;
