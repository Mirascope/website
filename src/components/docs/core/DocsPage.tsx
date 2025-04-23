import React from "react";
import DocsLayout from "./DocsLayout";
import SEOMeta from "@/src/components/SEOMeta";
import { type DocContent } from "@/src/lib/content/docs";
import { type ProductName } from "@/src/lib/route-types";

type DocsPageProps = {
  product: ProductName;
  section: string | null;
  splat: string;
  document: DocContent;
};

/**
 * DocsPage component - Uses loaded data from TanStack Router
 */
const DocsPage: React.FC<DocsPageProps> = ({ product, section, splat, document }) => {
  // Parse the path into group/slug components
  const pathParts = splat.split("/").filter(Boolean);

  // Extract group if it exists (first part of the splat)
  const group = pathParts.length > 0 ? pathParts[0] : null;

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
      <SEOMeta title={title} description={description} url={urlPath} product={product} />
      <DocsLayout product={product} group={group} document={document} />
    </>
  );
};

export default DocsPage;
