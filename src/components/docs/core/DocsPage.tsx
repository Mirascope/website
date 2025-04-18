import React from "react";
import DocsLayout from "./DocsLayout";
import SEOHelmet from "@/components/SEOHelmet";
import { type DocMeta, type DocContent } from "@/lib/content/docs";
import { type ProductName } from "@/lib/route-types";

type DocsPageProps = {
  product: ProductName;
  section: string | null;
  splat: string;
  document: DocContent;
  docs: DocMeta[];
};

/**
 * DocsPage component - Uses loaded data from TanStack Router
 */
const DocsPage: React.FC<DocsPageProps> = ({ product, section, splat, document, docs }) => {
  // Parse the path into group/slug components
  const pathParts = splat.split("/").filter(Boolean);

  // Extract group if it exists (first part of the splat)
  const group = pathParts.length > 0 ? pathParts[0] : null;

  // Extract current slug (last part) for sidebar highlighting
  const currentSlug = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "index";

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

  // Render the layout with the loaded content
  return (
    <>
      <SEOHelmet title={title} description={description} url={urlPath} product={product} />
      <DocsLayout
        product={product}
        section={section}
        slug={currentSlug}
        group={group}
        document={document}
        docs={docs}
      />
    </>
  );
};

export default DocsPage;
