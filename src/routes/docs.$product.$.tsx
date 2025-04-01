import { createFileRoute, useParams } from "@tanstack/react-router";
import DocsPage from "@/components/DocsPage";

export const Route = createFileRoute("/docs/$product/$")({
  component: DocsProductPage,
  // Don't match if the next part is a special section - those are handled by specific routes
  validateParams: ({ product, _splat }) => {
    // Skip API and guides routes - those are handled by specific routes
    if (_splat.startsWith("api/") || _splat.startsWith("guides/")) {
      return false;
    }
    return { product, _splat };
  },
});

function DocsProductPage() {
  // Get the product and remaining path
  const { product, _splat } = useParams({ from: "/docs/$product/$" });

  // No section for regular product routes
  const section = null;
  
  // Use the shared DocsPage component
  return (
    <DocsPage
      product={product}
      section={section}
      splat={_splat}
    />
  );
}