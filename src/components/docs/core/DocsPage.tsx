import React, { useState, useEffect } from "react";
import DocsLayout from "./DocsLayout";
import useSEO from "@/lib/hooks/useSEO";
import { getDoc, getDocsForProduct, type DocMeta } from "@/lib/docs";
import { type ProductName } from "@/lib/route-types";

type DocsPageProps = {
  product: ProductName;
  section: string | null;
  splat: string;
};

/**
 * DocsPage component - Handles data fetching and state management for all doc pages
 *
 * Handles loading documents, error states, and passes data to DocsLayout
 */
const DocsPage: React.FC<DocsPageProps> = ({ product, section, splat }) => {
  const [document, setDocument] = useState<{
    meta: DocMeta;
    content: string;
  } | null>(null);
  const [productDocs, setProductDocs] = useState<DocMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse the path into group/slug components
  const pathParts = splat.split("/").filter(Boolean);

  // Extract group if it exists (first part of the splat)
  const group = pathParts.length > 0 ? pathParts[0] : null;

  // Extract current slug (last part) for sidebar highlighting
  const currentSlug = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "index";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load all docs for this product for the sidebar
        const docsForProduct = getDocsForProduct(product);
        setProductDocs(docsForProduct);

        // Build the path based on whether this is in a section or not
        const docPath = section
          ? `/docs/${product}/${section}/${splat}`
          : `/docs/${product}/${splat}`;

        // For index pages, append /index, ensuring no double slashes
        const docPathNoTrailingSlash = docPath.endsWith("/") ? docPath.slice(0, -1) : docPath;
        const finalPath =
          splat === "" || splat === "/" ? `${docPathNoTrailingSlash}/index` : docPath;

        // Fetch the document
        const doc = await getDoc(finalPath);
        setDocument(doc);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[DocsPage] Failed to load document: ${errorMessage}`);
        setError(`Failed to load document: ${errorMessage}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [splat, product, section]);

  // Generate debug error details if needed
  let errorDetails:
    | {
        expectedPath: string;
        path: string;
        product: ProductName;
        section: string | null;
        group: string | null;
        slug: string;
      }
    | undefined = undefined;
  if (error) {
    const expectedPath = section
      ? `/src/docs/${product}/${section}/${splat}.mdx`
      : `/src/docs/${product}/${splat}.mdx`;

    // Prepare debug info as a simple object
    errorDetails = {
      expectedPath,
      path: splat,
      product,
      section,
      group,
      slug: currentSlug,
    };

    // Log detailed error information to console
    console.error("[DocsPage] Document not found or invalid:", errorDetails);
  }

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

  // Construct the URL path
  const urlPath = section ? `/docs/${product}/${section}/${splat}` : `/docs/${product}/${splat}`;

  // Apply SEO for docs page
  useSEO({
    title,
    description,
    url: urlPath,
    product,
  });

  // Use the shared layout component
  return (
    <DocsLayout
      product={product}
      section={section}
      slug={currentSlug}
      group={group}
      document={document}
      docs={productDocs}
      loading={loading}
      error={error}
    />
  );
};

export default DocsPage;
