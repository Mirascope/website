import { createFileRoute, useParams } from "@tanstack/react-router";
import { DocsPage } from "@/components/docs";
import { type ProductName } from "@/lib/route-types";

export const Route = createFileRoute("/docs/$product/api/$")({
  component: DocsApiPage,
});

function DocsApiPage() {
  // Get the product and API path
  const { product, _splat } = useParams({ from: "/docs/$product/api/$" });

  // For API routes, the section is always 'api'
  const section = "api";

  // Use the shared DocsPage component
  return <DocsPage product={product as ProductName} section={section} splat={_splat || ""} />;
}
