import React from "react";
import BaseLayout from "@/components/BaseLayout";
import SidebarContainer from "@/components/SidebarContainer";
import ErrorContent from "@/components/ErrorContent";
import { type DocMeta } from "@/lib/docs";
import { type ProductName } from "@/lib/route-types";
import useFunMode from "@/lib/hooks/useFunMode";
import useProviderSelection from "@/lib/hooks/useProviderSelection";
import useMDXProcessor from "@/lib/hooks/useMDXProcessor";
import { ProviderContextProvider } from "@/components/docs";
import TocSidebar from "./TocSidebar";
import MainContent from "./MainContent";
import LoadingContent from "./LoadingContent";

type DocsLayoutProps = {
  product: ProductName;
  section: string | null;
  slug: string;
  group?: string | null;
  document: { meta: DocMeta; content: string } | null;
  docs: DocMeta[];
  loading: boolean;
  error: string | null;
};

/**
 * DocsLayout - Shared layout for all documentation pages
 *
 * Handles loading states, error states, and the common layout
 * between all doc page types (product index, regular docs, API docs)
 */
const DocsLayout: React.FC<DocsLayoutProps> = ({
  product,
  section,
  slug,
  group = null,
  document,
  docs,
  loading,
  error,
}) => {
  // Use custom hooks for state management
  const [funMode, toggleFunMode] = useFunMode();
  const [selectedProvider, handleProviderChange] = useProviderSelection();

  // Process MDX content using the custom hook
  const { compiledMDX } = useMDXProcessor(document?.content, document?.meta);

  // Left sidebar content
  const leftSidebar = (
    <SidebarContainer
      product={product}
      section={section}
      slug={slug}
      group={group}
      docs={loading ? [] : docs}
    />
  );

  // Right sidebar content (TOC)
  const rightSidebar =
    !loading && !error && document ? (
      <TocSidebar
        product={product}
        section={section}
        slug={slug}
        funMode={funMode}
        toggleFunMode={toggleFunMode}
      />
    ) : (
      <div className="w-56 flex-shrink-0 hidden lg:block"></div>
    );

  // Main content
  let mainContent;
  if (loading) {
    mainContent = <LoadingContent className="flex-1 min-w-0 px-8" />;
  } else if (error || !document) {
    mainContent = (
      <ErrorContent
        title="Document Not Found"
        message={error || "The document you're looking for doesn't exist or is invalid."}
      />
    );
  } else {
    mainContent = <MainContent document={document} compiledMDX={compiledMDX} funMode={funMode} />;
  }

  return (
    <ProviderContextProvider
      defaultProvider={selectedProvider}
      onProviderChange={handleProviderChange}
    >
      <BaseLayout leftSidebar={leftSidebar} mainContent={mainContent} rightSidebar={rightSidebar} />
    </ProviderContextProvider>
  );
};

export default DocsLayout;
