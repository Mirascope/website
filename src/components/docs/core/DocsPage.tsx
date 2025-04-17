import React from "react";
import DocsLayout from "./DocsLayout";
import useSEO from "@/lib/hooks/useSEO";
import { getDoc, getDocsForProduct, type DocMeta } from "@/lib/content/docs";
import { type ProductName } from "@/lib/route-types";
import { createSuspenseResource } from "@/lib/hooks/useSuspense";

// Document content resource component
function DocumentContent({
  product,
  section,
  splat,
  currentSlug,
  group,
}: {
  product: ProductName;
  section: string | null;
  splat: string;
  currentSlug: string;
  group: string | null;
}) {
  // Build the document path
  const docPath = section ? `/docs/${product}/${section}/${splat}` : `/docs/${product}/${splat}`;

  // For index pages, append /index, ensuring no double slashes
  const docPathNoTrailingSlash = docPath.endsWith("/") ? docPath.slice(0, -1) : docPath;

  // Handle empty splat cases correctly
  const finalPath = splat === "" || splat === "/" ? `${docPathNoTrailingSlash}/index` : docPath;

  // Create resources for both content needed
  const docResource = createSuspenseResource(`doc:${finalPath}`, () => getDoc(finalPath));
  const docsResource = createSuspenseResource(`docs:${product}`, () => getDocsForProduct(product));

  // Read the resources (this will throw and suspend if data isn't ready)
  const document = docResource.read();
  const productDocs = docsResource.read();

  // Define SEO properties based on document meta and product
  const title = document?.meta.title || "";

  // Use product-specific descriptions
  let description = document?.meta.description || "";
  if (!description) {
    if (product === "mirascope") {
      description = "LLM abstractions that aren't obstructions.";
    } else if (product === "lilypad") {
      description = "An open-source prompt engineering framework.";
    }
  }

  // Construct the URL path for SEO
  const urlPath = section ? `/docs/${product}/${section}/${splat}` : `/docs/${product}/${splat}`;

  // Apply SEO for docs page
  useSEO({
    title,
    description,
    url: urlPath,
    product,
  });

  // Render the layout with the loaded content
  return (
    <DocsLayout
      product={product}
      section={section}
      slug={currentSlug}
      group={group}
      document={document}
      docs={productDocs}
    />
  );
}

type DocsPageProps = {
  product: ProductName;
  section: string | null;
  splat: string;
};

/**
 * DocsPage component - Uses Suspense for data loading
 *
 * Handles path parsing and uses Suspense for loading document and docs
 */
const DocsPage: React.FC<DocsPageProps> = ({ product, section, splat }) => {
  // Parse the path into group/slug components
  const pathParts = splat.split("/").filter(Boolean);

  // Extract group if it exists (first part of the splat)
  const group = pathParts.length > 0 ? pathParts[0] : null;

  // Extract current slug (last part) for sidebar highlighting
  const currentSlug = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "index";

  // Create a fallback for empty docs
  const emptyDocs: DocMeta[] = [];

  // Use error boundary pattern with Suspense
  return (
    <React.Suspense
      fallback={
        <DocsLayout
          product={product}
          section={section}
          slug={currentSlug}
          group={group}
          // Provide a minimal empty document for the loading state
          document={{
            meta: {
              title: "Loading...",
              description: "",
              slug: currentSlug,
              type: "doc",
              product,
              path: "",
            },
            mdx: { code: "", frontmatter: {} },
            content: "",
          }}
          docs={emptyDocs}
        />
      }
    >
      <DocumentContent
        product={product}
        section={section}
        splat={splat}
        currentSlug={currentSlug}
        group={group}
      />
    </React.Suspense>
  );
};

export default DocsPage;
