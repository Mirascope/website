import React, { useState, useEffect } from "react";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";
import { MDXRenderer } from "@/components/MDXRenderer";
import { processMDX } from "@/lib/mdx-utils";
import { type DocMeta } from "@/lib/docs";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type DocsLayoutProps = {
  product: string;
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
    product: string;
    section?: string;
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
  const [compiledMDX, setCompiledMDX] = useState<{ code: string; frontmatter: Record<string, any> } | null>(null);
  // Track if we're at a small screen breakpoint
  const [isSmallScreen, setIsSmallScreen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768; // md breakpoint is 768px in Tailwind
    }
    return false; // Default to large screen for SSR
  });

  // Sidebar expanded state - only collapsible at mobile/tablet breakpoint
  // Default to expanded on large screens and collapsed on small screens
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768; // Auto-collapsed on small screens
    }
    return true; // Default to expanded for SSR
  });

  // Update breakpoint state based on window resize
  useEffect(() => {
    const handleResize = () => {
      const smallScreen = window.innerWidth < 768;
      const wasSmallScreen = isSmallScreen;

      // Update small screen state
      setIsSmallScreen(smallScreen);

      if (!smallScreen) {
        // Auto-expand sidebar on large screens
        setSidebarExpanded(true);
      } else if (!wasSmallScreen && smallScreen) {
        // Auto-collapse when crossing from large to small screen
        setSidebarExpanded(false);
      }
    };

    // Initialize on first render
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, [isSmallScreen]);

  // Toggle sidebar expanded/collapsed (only used on small screens)
  const toggleSidebar = () => {
    if (isSmallScreen) {
      setSidebarExpanded(!sidebarExpanded);
    }
  };

  // Initialize fun mode from localStorage if available
  const [funMode, setFunMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("docsFunMode") === "true";
    }
    return false;
  });

  // Toggle fun mode (handwriting font for docs content)
  const toggleFunMode = () => {
    const newMode = !funMode;
    setFunMode(newMode);

    // Save preference to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("docsFunMode", newMode.toString());
    }
  };
  
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
          {/* Left sidebar - collapsible on mobile only */}
          <div
            className={`transition-all duration-300 ease-in-out flex flex-shrink-0 ${
              sidebarExpanded ? "w-64" : isSmallScreen ? "w-10" : "w-64"
            }`}
          >
            {/* Collapsed sidebar toggle button (show only when collapsed on small screens) */}
            {isSmallScreen && !sidebarExpanded && (
              <div className="fixed top-[120px] z-20">
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center w-10 h-10 bg-white rounded-r-md border border-l-0 border-gray-200 shadow-sm hover:bg-gray-50"
                  aria-label="Expand sidebar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            )}

            {/* Sidebar content */}
            <div
              className={`fixed h-[calc(100vh-60px)] top-[60px] pt-6 transition-all duration-300 ease-in-out ${
                sidebarExpanded
                  ? "w-64 opacity-100"
                  : isSmallScreen
                    ? "w-0 opacity-0 overflow-hidden"
                    : "w-64 opacity-100"
              }`}
            >
              {/* Expanded sidebar toggle button (show only on small screens when expanded) */}
              {isSmallScreen && sidebarExpanded && (
                <div className="absolute top-6 right-2 z-20">
                  <button
                    onClick={toggleSidebar}
                    className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100"
                    aria-label="Collapse sidebar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                </div>
              )}

              <div className="h-full overflow-y-auto">
                <DocsSidebar
                  product={product}
                  section={section}
                  currentSlug={slug}
                  currentGroup={group}
                  docs={[]}
                />
              </div>
            </div>
          </div>

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
          {/* Left sidebar - collapsible on mobile only */}
          <div
            className={`transition-all duration-300 ease-in-out flex flex-shrink-0 ${
              sidebarExpanded ? "w-64" : isSmallScreen ? "w-10" : "w-64"
            }`}
          >
            {/* Collapsed sidebar toggle button (show only when collapsed on small screens) */}
            {isSmallScreen && !sidebarExpanded && (
              <div className="fixed top-[120px] z-20">
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center w-10 h-10 bg-white rounded-r-md border border-l-0 border-gray-200 shadow-sm hover:bg-gray-50"
                  aria-label="Expand sidebar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </div>
            )}

            {/* Sidebar content */}
            <div
              className={`fixed h-[calc(100vh-60px)] top-[60px] pt-6 transition-all duration-300 ease-in-out ${
                sidebarExpanded
                  ? "w-64 opacity-100"
                  : isSmallScreen
                    ? "w-0 opacity-0 overflow-hidden"
                    : "w-64 opacity-100"
              }`}
            >
              {/* Expanded sidebar toggle button (show only on small screens when expanded) */}
              {isSmallScreen && sidebarExpanded && (
                <div className="absolute top-6 right-2 z-20">
                  <button
                    onClick={toggleSidebar}
                    className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-100"
                    aria-label="Collapse sidebar"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>
                </div>
              )}

              <div className="h-full overflow-y-auto">
                <DocsSidebar
                  product={product}
                  section={section}
                  currentSlug={slug}
                  currentGroup={group}
                  docs={docs}
                />
              </div>
            </div>
          </div>

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
                  {errorDetails.section && (
                    <li>Section: {errorDetails.section}</li>
                  )}
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
    <div className="flex justify-center pt-[60px]">
      <div className="flex mx-auto w-full max-w-7xl">
        {/* Left sidebar - collapsible on mobile only */}
        <div
          className={`transition-all duration-300 ease-in-out flex flex-shrink-0 ${
            sidebarExpanded ? "w-64" : isSmallScreen ? "w-10" : "w-64"
          }`}
        >
          {/* Collapsed sidebar toggle button (show only when collapsed on small screens) */}
          {isSmallScreen && !sidebarExpanded && (
            <div className="fixed top-[110px] z-20">
              <button
                onClick={toggleSidebar}
                className="flex items-center rounded bg-white border border-gray-300 justify-center w-6 h-6 rounded hover:bg-gray-100"
                aria-label="Expand sidebar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="stroke-gray-300"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}

          {/* Sidebar content */}
          <div
            className={`fixed h-[calc(100vh-60px)] top-[60px] pt-6 transition-all duration-300 ease-in-out ${
              sidebarExpanded
                ? "w-64 opacity-100"
                : isSmallScreen
                  ? "w-0 opacity-0 overflow-hidden"
                  : "w-64 opacity-100"
            }`}
          >
            {/* Expanded sidebar toggle button (show only on small screens when expanded) */}
            {isSmallScreen && sidebarExpanded && (
              <div className="absolute top-12 right-2 z-20">
                <button
                  onClick={toggleSidebar}
                  className="flex items-center justify-center rounded border border-gray-300 w-6 h-6 hover:bg-gray-100"
                  aria-label="Collapse sidebar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="stroke-gray-300"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
              </div>
            )}

            <div className="h-full overflow-y-auto">
              <DocsSidebar
                product={product}
                section={section}
                currentSlug={slug}
                currentGroup={group}
                docs={docs}
              />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0 px-4 lg:px-8">
          <div className="w-full max-w-5xl mx-auto">
            <h1 className="text-3xl lg:text-4xl font-semibold mb-4">
              {document.meta.title}
            </h1>
            {document.meta.description &&
              document.meta.description.trim() !== "" && (
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {document.meta.description}
                </p>
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

                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
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
  );
};

export default DocsLayout;
