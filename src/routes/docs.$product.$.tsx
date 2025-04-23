import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { DocsPage, LoadingDocsPage } from "@/src/components/docs";
import { docsPageLoader } from "@/src/lib/content/loaders";
import { environment } from "@/src/lib/content/environment";
import ContentErrorHandler from "@/src/components/ContentErrorHandler";

export const Route = createFileRoute("/docs/$product/$")({
  component: DocsProductPage,

  // Use the docs loader
  loader: ({ params }) => docsPageLoader({ params }),

  // Configure loading state
  pendingComponent: () => {
    // Hardcoded to Mirascope to address router issues
    // TODO: Better if we choose the correct product
    // (Can split into hardcoded per-product routes if needed)
    return <LoadingDocsPage product={"mirascope"} />;
  },

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

function DocsProductPage() {
  // Get the loaded data from the loader
  const doc = useLoaderData({
    from: "/docs/$product/$",
    structuralSharing: false,
  });

  // Use the shared DocsPage component
  return <DocsPage document={doc} />;
}
