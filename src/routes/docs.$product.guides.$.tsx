import { createFileRoute, useParams } from "@tanstack/react-router";
import { DocsPage } from "@/components/docs";
import { type ProductName } from "@/lib/route-types";

export const Route = createFileRoute("/docs/$product/guides/$")({
  component: DocsGuidesPage,
});

function DocsGuidesPage() {
  // Get the product and guides path
  const { product, _splat } = useParams({ from: "/docs/$product/guides/$" });

  // For guides routes, the section is always 'guides'
  const section = "guides";

  // Use the shared DocsPage component
  return <DocsPage product={product as ProductName} section={section} splat={_splat || ""} />;
}
