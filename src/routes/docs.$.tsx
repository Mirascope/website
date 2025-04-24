import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { DocsPage, LoadingDocsPage } from "@/src/components/docs";
import { getDocContent, getAllDocInfo } from "@/src/lib/content";
import { environment } from "@/src/lib/content/environment";
import ContentErrorHandler from "@/src/components/ContentErrorHandler";
import type { DocInfo } from "@/src/lib/content/spec";

// Create a reverse index mapping from route paths to DocInfo
// This is created once on module load and reused for all requests
const routePathToDocInfo = new Map<string, DocInfo>();

// Initialize the route path index
function initializeRoutePathIndex() {
  const allDocInfo = getAllDocInfo();

  // Build the reverse index
  for (const docInfo of allDocInfo) {
    // Store with and without trailing slash to handle both cases
    routePathToDocInfo.set(docInfo.routePath, docInfo);

    // Also add version without trailing slash if it has one
    if (docInfo.routePath.endsWith("/")) {
      routePathToDocInfo.set(docInfo.routePath.slice(0, -1), docInfo);
    }
    // And add version with trailing slash if it doesn't have one
    else if (!docInfo.routePath.endsWith("/")) {
      routePathToDocInfo.set(docInfo.routePath + "/", docInfo);
    }
  }
}

// Initialize the index when the module loads
initializeRoutePathIndex();

/**
 * Content loader that uses a reverse index from route paths to DocInfo
 * for robust path resolution regardless of trailing slashes
 */
async function contentPathLoader({ params }: { params: { _splat: string } }) {
  // Construct the full route path from the splat parameter
  const splat = params._splat;
  const routePath = `/docs/${splat}`;

  console.log("Loading content for route path:", routePath);

  try {
    // Look up DocInfo for this route path
    const docInfo = routePathToDocInfo.get(routePath);

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
    return <LoadingDocsPage product={"mirascope"} />;
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

  // Use the shared DocsPage component
  return <DocsPage document={document} />;
}
