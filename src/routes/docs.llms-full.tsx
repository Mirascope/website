import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { LLMDocViewer } from "@/src/components/routes/docs";
import { environment } from "@/src/lib/content/environment";
import { ContentErrorHandler } from "@/src/components";
import { LLMDocument } from "@/src/lib/content/llm-documents";

/**
 * Loader for LLM document viewer routes
 * Handles routes like /docs/llms-full, /docs/mirascope/llms-full, etc.
 */
async function llmDocLoader() {
  console.log("LLM Doc Loader - llms-full");

  // Construct paths to both JSON and TXT files
  const jsonPath = `/static/content/docs/llms-full.json`;
  const txtPath = `/docs/llms-full.txt`;

  try {
    // Fetch the processed JSON data
    const response = await fetch(jsonPath);

    if (!response.ok) {
      throw new Error(`LLM document not found: ${jsonPath}`);
    }

    const data = await response.json();
    const document = LLMDocument.fromJSON(data);

    return {
      document,
      txtPath,
      viewerPath: `/docs/llms-full`,
    };
  } catch (error) {
    console.error(`Error loading LLM doc: ${jsonPath}`, error);
    throw error;
  }
}

export const Route = createFileRoute("/docs/llms-full")({
  component: LLMDocViewerPage,

  loader: llmDocLoader,

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

function LLMDocViewerPage() {
  const data = useLoaderData({
    from: "/docs/llms-full",
    structuralSharing: false,
  });

  return <LLMDocViewer {...data} />;
}
