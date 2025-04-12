import React, { useState, useEffect } from "react";
import SidebarContainer from "@/components/SidebarContainer";
import TocSidebar from "@/components/TocSidebar";
import MainContent from "@/components/MainContent";
import { processMDX } from "@/lib/mdx-utils";
import { type DocMeta } from "@/lib/docs";
import { type ProductName } from "@/lib/route-types";
import useFunMode from "@/lib/hooks/useFunMode";
import useProviderSelection from "@/lib/hooks/useProviderSelection";
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
  // State for compiled MDX content
  const [compiledMDX, setCompiledMDX] = useState<{
    code: string;
    frontmatter: Record<string, any>;
  } | null>(null);

  // Use custom hooks for localStorage state management
  const [funMode, toggleFunMode] = useFunMode();
  const [selectedProvider, handleProviderChange] = useProviderSelection();

  // Process MDX content when document changes
  useEffect(() => {
    const processContent = async () => {
      if (document && document.content) {
        try {
          const result = await processMDX(document.content);
          setCompiledMDX(result);
        } catch (error) {
          console.error("Error processing MDX:", error);
          setCompiledMDX(null);
        }
      } else {
        setCompiledMDX(null);
      }
    };

    processContent();
  }, [document]);
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
          <div className="flex-1 min-w-0 flex justify-center items-center py-20 px-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>

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
          <div className="flex-1 min-w-0 py-20 flex flex-col items-center justify-center px-8">
            <h1 className="text-2xl font-medium mb-4">Document Not Found</h1>
            <p className="text-gray-500 dark:text-gray-400">
              {error || "The document you're looking for doesn't exist."}
            </p>
            {errorDetails && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-sm">
                <p>Looking for file: {errorDetails.expectedPath}</p>
                <p className="mt-2">Debug info:</p>
                <ul className="list-disc ml-5 mt-1">
                  <li>Path: {errorDetails.path}</li>
                  <li>Product: {errorDetails.product}</li>
                  {errorDetails.section && <li>Section: {errorDetails.section}</li>}
                  {errorDetails.group && <li>Group: {errorDetails.group}</li>}
                  <li>Slug: {errorDetails.slug}</li>
                  <li>Expected path: {errorDetails.expectedPath}</li>
                </ul>
              </div>
            )}
          </div>

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
