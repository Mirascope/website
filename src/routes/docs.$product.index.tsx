import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/$product/")({
  component: ProductDocsIndexPage,
});

function ProductDocsIndexPage() {
  const { product } = useParams({ from: "/docs/$product/" });
  
  // Redirect to the product's main documentation
  return <Navigate to={`/docs/${product}/main/index`} />;
}