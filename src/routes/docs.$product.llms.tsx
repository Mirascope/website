import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AppLayout, PageMeta } from "@/src/components";
import { MainContent, TocSidebar } from "@/src/components/routes/llms";
import { environment } from "@/src/lib/content/environment";
import { ContentErrorHandler } from "@/src/components";
import { LLMContent } from "@/src/lib/content/llm-content";
import DocsSidebar from "@/src/components/routes/docs/DocsSidebar";
import type { ProductName } from "@/src/lib/content/doc-registry";
import { ButtonLink } from "@/src/components/ui/button-link";

/**
 * Loader for product-specific LLM document viewer routes
 * Handles routes like /docs/mirascope/llms, /docs/lilypad/llms
 */
async function productLlmDocLoader({ params }: { params: { product: ProductName } }) {
  const { product } = params;

  // Validate product
  if (product !== "mirascope" && product !== "lilypad") {
    throw new Error(`Invalid product: ${product}`);
  }

  // Construct paths to both JSON and TXT files
  const jsonPath = `/static/content/docs/${product}/llms.json`;
  const txtPath = `/docs/${product}/llms.txt`;

  try {
    // Fetch the processed JSON data
    const response = await environment.fetch(jsonPath);

    if (!response.ok) {
      throw new Error(`LLM document not found: ${jsonPath}`);
    }

    const data = await response.json();
    const document = LLMContent.fromJSON(data);

    return {
      document,
      txtPath,
      viewerPath: `/docs/${product}/llms`,
      product,
    };
  } catch (error) {
    console.error(`Error loading LLM doc: ${jsonPath}`, error);
    throw error;
  }
}

export const Route = createFileRoute("/docs/$product/llms")({
  component: ProductLLMDocViewerPage,

  loader: productLlmDocLoader,

  pendingComponent: () => {
    return <div>Loading LLM document...</div>;
  },

  errorComponent: ({ error }) => {
    environment.onError(error);
    return (
      <ContentErrorHandler
        error={error instanceof Error ? error : new Error(String(error))}
        contentType="llm-docs"
      />
    );
  },
});

function ProductLLMDocViewerPage() {
  const data = useLoaderData({
    from: "/docs/$product/llms",
    structuralSharing: false,
  });

  const { document, txtPath, product } = data;

  return (
    <>
      <PageMeta title={document.title} description={document.description} />
      <AppLayout>
        <AppLayout.LeftSidebar>
          <DocsSidebar product={product} />
        </AppLayout.LeftSidebar>

        <AppLayout.Content>
          <MainContent document={document} txtPath={txtPath} />
        </AppLayout.Content>

        <AppLayout.RightSidebar mobileCollapsible>
          <ButtonLink variant="outline" href="/llms-full">
            Cross-Product LLM Docs
          </ButtonLink>
          <TocSidebar document={document} />
        </AppLayout.RightSidebar>
      </AppLayout>
    </>
  );
}
