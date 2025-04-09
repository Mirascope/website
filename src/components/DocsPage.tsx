import React, { useState, useEffect } from "react";
import DocsLayout from "@/components/DocsLayout";
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

        // Build the full path for getDoc
        let fullPath;
        if (section) {
          // Section-specific path like /docs/product/api/...
          fullPath = `/docs/${product}/${section}/${splat}`;
        } else {
          // Regular product path like /docs/product/...
          fullPath = `/docs/${product}/${splat}`;
        }

        const logPrefix = section
          ? `[Docs${section.charAt(0).toUpperCase() + section.slice(1)}Page]`
          : `[DocsProductPage]`;

        try {
          // Get the document with a fallback system
          let doc = null;

          // Handle the index case (empty splat)
          if (splat === "" || splat === "/") {
            // Section or product landing page
            const indexPath = section
              ? `/docs/${product}/${section}/index`
              : `/docs/${product}/index`;
            try {
              doc = await getDoc(indexPath);
            } catch (indexError) {
              doc = await getDoc(fullPath);
            }
          } else {
            // For other paths, try the exact path first
            try {
              doc = await getDoc(fullPath);
            } catch (exactPathError) {
              // If the path doesn't end with a slash, try with /index
              if (!splat.endsWith("/") && !splat.endsWith(".mdx")) {
                try {
                  const indexPath = `${fullPath}/index`;
                  doc = await getDoc(indexPath);
                } catch (indexError) {
                  // If index doesn't exist either, throw the original error
                  console.error(`${logPrefix} Index not found either`, indexError);
                  throw exactPathError;
                }
              } else {
                // If it's already a specific path that failed, just throw the error
                throw exactPathError;
              }
            }
          }

          if (!doc) {
            throw new Error("Document is null or undefined");
          }

          // Check for empty content and provide fallback
          if (!doc.content || doc.content.trim() === "") {
            console.warn(`${logPrefix} Empty content for ${fullPath}, using fallback`);

            // Create appropriate title based on section
            let fallbackTitle;
            if (section === "api") {
              fallbackTitle = "API Documentation";
            } else if (section === "guides") {
              fallbackTitle = "Guides";
            } else {
              fallbackTitle = "Documentation";
            }

            doc.content = `# ${doc.meta.title || fallbackTitle}`;
          }

          setDocument(doc);
          setLoading(false);
        } catch (fetchErr) {
          console.error(
            `${logPrefix} Error fetching document: ${fetchErr instanceof Error ? fetchErr.message : String(fetchErr)}`
          );

          // If this is an index page, create a fallback
          if (splat === "" || splat === "/") {
            // Determine title and content based on section
            let title, content;
            const productCapitalized = product.charAt(0).toUpperCase() + product.slice(1);

            if (section === "api") {
              title = `${productCapitalized} API Documentation`;
              content = `---
title: ${title}
description: ""
---

# ${title}

Explore the API documentation using the sidebar.`;
            } else if (section === "guides") {
              title = `${productCapitalized} Guides`;
              content = `---
title: ${title}
description: ""
---

# ${title}

Explore the guides using the sidebar navigation.`;
            } else {
              title = `${productCapitalized} Documentation`;
              content = `---
title: ${title}
description: ""
---

# ${title}

Get started with ${product} by exploring the documentation in the sidebar.`;
            }

            // Create the document with appropriate metadata
            setDocument({
              meta: {
                title,
                description: "",
                slug: "index",
                path: section ? `${product}/${section}` : product,
                product,
                section: section || undefined,
                type: section ? "section-item" : "item",
              },
              content,
            });
            setLoading(false);
            return;
          }

          throw fetchErr;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[DocsPage] Failed to load document: ${errorMessage}`);
        setError(`Failed to load document: ${errorMessage}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [splat, product, section, group, currentSlug]);

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
      errorDetails={errorDetails}
    />
  );
};

export default DocsPage;
