import React, { useState, useEffect } from "react";
import SidebarContainer from "@/components/SidebarContainer";
import TableOfContents from "@/components/TableOfContents";
import { MDXRenderer } from "@/components/MDXRenderer";
import { processMDX } from "@/lib/mdx-utils";
import { type DocMeta } from "@/lib/docs";
import { Button } from "@/components/ui/button";
import { Sparkles, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ProductName } from "@/lib/route-types";
import useFunMode from "@/lib/hooks/useFunMode";
import useProviderSelection from "@/lib/hooks/useProviderSelection";
import { ProviderContextProvider, ProviderDropdown } from "@/components/docs";

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

          {/* Right TOC sidebar - empty during loading */}
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

          {/* Right TOC sidebar - empty during error state */}
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
          <div className="flex-1 min-w-0 px-4 lg:px-8">
            <div className="w-full max-w-5xl mx-auto">
              <h1 className="text-3xl lg:text-4xl font-semibold mb-4">{document.meta.title}</h1>
              {document.meta.description && document.meta.description.trim() !== "" && (
                <p className="text-gray-600 dark:text-gray-300 mb-6">{document.meta.description}</p>
              )}
              <div
                id="doc-content"
                className="prose prose-sm lg:prose-base prose-slate max-w-none overflow-x-auto mdx-container"
              >
                {document.content ? (
                  compiledMDX ? (
                    <MDXRenderer
                      code={compiledMDX.code}
                      frontmatter={compiledMDX.frontmatter}
                      useFunMode={funMode}
                    />
                  ) : (
                    <div className="animate-pulse bg-gray-100 h-40 rounded-md"></div>
                  )
                ) : (
                  <div></div> /* Empty div for no content */
                )}
              </div>
            </div>
          </div>

          {/* Right TOC sidebar */}
          <div className="w-56 flex-shrink-0 hidden lg:block">
            <div className="fixed w-56 top-[60px] max-h-[calc(100vh-60px)] overflow-y-auto">
              <div className="px-4 pt-12">
                <div className="flex flex-col gap-3 mb-4">
                  <Button
                    variant={funMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleFunMode}
                    className={cn(
                      funMode ? "bg-primary text-white" : "hover:bg-purple-50",
                      "transition-colors w-full"
                    )}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Fun Mode
                  </Button>

                  {/* Provider dropdown */}
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      <div className="flex items-center">
                        <Server className="w-3 h-3 mr-1" />
                        Provider
                      </div>
                    </h4>
                    <ProviderDropdown />
                  </div>

                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-4">
                    On this page
                  </h4>
                </div>
                <TableOfContents
                  contentId="doc-content"
                  product={product}
                  section={section}
                  slug={slug}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProviderContextProvider>
  );
};

export default DocsLayout;
