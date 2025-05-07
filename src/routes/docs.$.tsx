import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { DocsPage } from "@/src/components/routes/docs";
import { getDocContent, docRegistry, type ProductName } from "@/src/lib/content";
import { environment } from "@/src/lib/content/environment";
import { ContentErrorHandler } from "@/src/components";

/**
 * Content loader that uses a reverse index from route paths to DocInfo
 * for robust path resolution regardless of trailing slashes
 */
async function contentPathLoader({ params }: { params: { _splat: string } }) {
  // Construct the full route path from the splat parameter
  const splat = params._splat;
  const routePath = `/docs/${splat}`;

  try {
    // Look up DocInfo for this route path using the docRegistry
    const docInfo = docRegistry.getDocInfoByRoutePath(routePath);

    if (!docInfo) {
      console.error(`No DocInfo found for route path: ${routePath}`);
      throw new Error(`Page not found: ${routePath}`);
    }

    // Use the content path from DocInfo to load the content
    // This uses the path property which is the doc-relative path
    return await getDocContent(docInfo.path);
  } catch (error) {
    console.error(`Error loading doc for route path: ${routePath}`, error);
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
    return <DocsPage isLoading product={"mirascope"} />;
  },

  errorComponent: ({ error }) => {
    environment.onError(error);
    return (
      <ContentErrorHandler
        error={error instanceof Error ? error : new Error(String(error))}
        contentType="doc"
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

  // Extract product from document metadata
  const product = document.meta.product as ProductName;

  // Use the shared DocsPage component
  return <DocsPage document={document} product={product} />;
}
