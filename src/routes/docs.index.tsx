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
  console.log("Redirecting to /docs/mirascope from /docs/");
  // Redirect to the Mirascope docs by default
  return <Navigate to="/docs/mirascope" />;
}