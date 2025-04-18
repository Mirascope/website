import { createFileRoute, Navigate } from "@tanstack/react-router";
import { getProductRoute } from "@/lib/routes";
import { environment } from "@/lib/content/environment";

export const Route = createFileRoute("/docs/")({
  component: DocsIndexPage,
  onError: (error: Error) => environment.onError(error),
});

/**
 * DocsIndexPage
 *
 * Default docs entry point. Redirects to the default product (Mirascope)
 */
function DocsIndexPage() {
  // Redirect to default product
  // Redirect to the Mirascope docs by default
  return <Navigate to={getProductRoute("mirascope")} />;
}
