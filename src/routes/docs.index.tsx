import { createFileRoute, Navigate } from "@tanstack/react-router";
import { getProductRoute } from "@/lib/routes";
import { environment } from "@/lib/content/environment";
import ContentErrorHandler from "@/components/ContentErrorHandler";

export const Route = createFileRoute("/docs/")({
  component: DocsIndexPage,
  errorComponent: ({ error }) => {
    environment.onError(error);
    return (
      <ContentErrorHandler
        error={error instanceof Error ? error : new Error(String(error))}
        contentType="docs"
      />
    );
  },
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
