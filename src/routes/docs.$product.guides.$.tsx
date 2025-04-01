import { createFileRoute, useParams } from "@tanstack/react-router";
import DocsPage from "@/components/DocsPage";

export const Route = createFileRoute("/docs/$product/guides/$")({
  component: DocsGuidesPage,
  // Don't match if the next part is another section or special path
  validateParams: ({ product, _splat }) => {
    // Accept all paths for guides section
    return { product, _splat };
  },
});

function DocsGuidesPage() {
  // Get the product and guides path
  const { product, _splat } = useParams({ from: "/docs/$product/guides/$" });
  
  // For guides routes, the section is always 'guides'
  const section = 'guides';
  
  // Use the shared DocsPage component
  return (
    <DocsPage
      product={product}
      section={section}
      splat={_splat}
    />
  );
}