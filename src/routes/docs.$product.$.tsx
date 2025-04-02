import { createFileRoute, useParams } from "@tanstack/react-router";
import DocsPage from "@/components/DocsPage";
import { type ProductName } from "@/lib/route-types";

export const Route = createFileRoute("/docs/$product/$")({
  component: DocsProductPage,
});

function DocsProductPage() {
  // Get the product and remaining path
  const { product, _splat } = useParams({ from: "/docs/$product/$" });

  // No section for regular product routes
  const section = null;
  
  // Use the shared DocsPage component
  return (
    <DocsPage
      product={product as ProductName}
      section={section}
      splat={_splat || ""}
    />
  );
}