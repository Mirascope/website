import { createFileRoute, Navigate, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/$product/$section/")({
  component: SectionDocsIndexPage,
});

function SectionDocsIndexPage() {
  const { product, section } = useParams({ from: "/docs/$product/$section/" });
  
  // Redirect to the section's index page
  return <Navigate to={`/docs/${product}/${section}/index`} />;
}