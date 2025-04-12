import React from "react";
import SidebarContainer from "@/components/SidebarContainer";
import TocSidebar from "@/components/TocSidebar";
import MainContent from "@/components/MainContent";
import LoadingContent from "@/components/LoadingContent";
import ErrorContent from "@/components/ErrorContent";
import { type DocMeta } from "@/lib/docs";
import { type ProductName } from "@/lib/route-types";
import useFunMode from "@/lib/hooks/useFunMode";
import useProviderSelection from "@/lib/hooks/useProviderSelection";
import useMDXProcessor from "@/lib/hooks/useMDXProcessor";
import { ProviderContextProvider } from "@/components/docs";

type DocsLayoutProps = {
  product: ProductName;
  section: string | null;
  slug: string;
  group?: string | null;
  document: { meta: DocMeta; content: string } | null;
  docs: DocMeta[];
  loading: boolean;
  error: string | null;
  errorDetails?: {
    expectedPath: string;
    path: string;
    product: ProductName;
    section?: string | null;
    group?: string | null;
    slug: string;
  };
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
  errorDetails,
}) => {
  // Use custom hooks for state management
  const [funMode, toggleFunMode] = useFunMode();
  const [selectedProvider, handleProviderChange] = useProviderSelection();

  // Process MDX content using the custom hook
  const { compiledMDX } = useMDXProcessor(document?.content, document?.meta);
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center pt-[60px]">
        <div className="flex mx-auto w-full max-w-7xl">
          {/* Left sidebar */}
          <SidebarContainer
            product={product}
            section={section}
            slug={slug}
            group={group}
            docs={[]}
          />

          {/* Main content area with loading spinner */}
          <LoadingContent className="flex-1 min-w-0 px-8" />

          {/* Empty TOC sidebar during loading */}
          <div className="w-56 flex-shrink-0 hidden lg:block"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !document) {
    return (
      <div className="flex justify-center pt-[60px]">
        <div className="flex mx-auto w-full max-w-7xl">
          {/* Left sidebar */}
          <SidebarContainer
            product={product}
            section={section}
            slug={slug}
            group={group}
            docs={docs}
          />

          {/* Main content area with error message */}
          <ErrorContent
            title="Document Not Found"
            message={error || "The document you're looking for doesn't exist."}
            debugInfo={errorDetails}
          />

          {/* Empty TOC sidebar during error state */}
          <div className="w-56 flex-shrink-0 hidden lg:block"></div>
        </div>
      </div>
    );
  }

  // Regular document display
  return (
    <ProviderContextProvider
      defaultProvider={selectedProvider}
      onProviderChange={handleProviderChange}
    >
      <div className="flex justify-center pt-[60px]">
        <div className="flex mx-auto w-full max-w-7xl">
          {/* Left sidebar */}
          <SidebarContainer
            product={product}
            section={section}
            slug={slug}
            group={group}
            docs={docs}
          />

          {/* Main content area */}
          <MainContent document={document} compiledMDX={compiledMDX} funMode={funMode} />

          {/* Right TOC sidebar */}
          <TocSidebar
            product={product}
            section={section}
            slug={slug}
            funMode={funMode}
            toggleFunMode={toggleFunMode}
          />
        </div>
      </div>
    </ProviderContextProvider>
  );
};

export default DocsLayout;
