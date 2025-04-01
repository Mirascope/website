import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/")({
  component: DocsIndexPage,
});

/**
 * DocsIndexPage
 * 
 * Default docs entry point. Redirects to the default product (Mirascope)
 */
function DocsIndexPage() {
  // Redirect to default product
  // Redirect to the Mirascope docs by default
  return <Navigate to="/docs/mirascope" />;
}