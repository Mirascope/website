import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { DocsPage, LoadingDocsPage } from "@/src/components/docs";
import { futureGetDoc as getFutureDoc } from "@/src/lib/content/docs";
import { environment } from "@/src/lib/content/environment";
import ContentErrorHandler from "@/src/components/ContentErrorHandler";

/**
 * Simplified loader that uses a splat parameter to capture the entire content path
 */
async function contentPathLoader({ params }: { params: { _splat: string } }) {
  const contentPath = params._splat;
  console.log("Loading content for path:", contentPath);

  // Format path for lookup - handle index pages
  let path = contentPath;
  if (path === "" || path.endsWith("/")) {
    path = path + "index";
  }

  try {
    // Use the new futureGetDoc function for content lookup
    return await getFutureDoc(path);
  } catch (error) {
    console.error(`Error loading doc: ${path}`, error);
    throw error;
  }
}

export const Route = createFileRoute("/docs/$")({
  component: DocsContentPage,

  // Use our simplified loader
  loader: contentPathLoader,

  // Configure loading state
  pendingComponent: () => {
    // We can't determine product from the URL during loading,
    // so use a default placeholder (mirascope)
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

function DocsContentPage() {
  // Get the loaded data from the loader
  const document = useLoaderData({
    from: "/docs/$",
    structuralSharing: false,
  });

  // Use the shared DocsPage component
  return <DocsPage document={document} />;
}
