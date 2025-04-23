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
const DocsPage: React.FC<DocsPageProps> = ({ document }) => {
  const meta = document.meta;
  const { title, path, description, product } = meta;

  const urlPath = `/docs/${path}`;

  // Render the layout with the loaded content
  return (
    <>
      <SEOMeta
        title={title}
        description={description}
        url={urlPath}
        product={product as ProductName}
      />
      <DocsLayout document={document} />
    </>
  );
};

export default DocsPage;
