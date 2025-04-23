import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { DocsPage, LoadingDocsPage } from "@/src/components/docs";
import { type ProductName } from "@/src/lib/route-types";
import { docsPageLoader } from "@/src/lib/content/loaders";
import type { DocContent } from "@/src/lib/content/docs";
import { environment } from "@/src/lib/content/environment";
import ContentErrorHandler from "@/src/components/ContentErrorHandler";

export const Route = createFileRoute("/docs/$product/$")({
  component: DocsProductPage,

  // Use the docs loader
  loader: ({ params }) => docsPageLoader({ params }),

  // Configure loading state
  pendingComponent: ({ params }) => {
    const { product } = params;
    return <LoadingDocsPage product={product as ProductName} />;
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
  const [document] = useLoaderData({
    from: "/docs/$product/$",
    structuralSharing: false,
  }) as [DocContent];

  // Use the shared DocsPage component
  return <DocsPage document={document} />;
}
