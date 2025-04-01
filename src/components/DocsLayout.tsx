import React, { useState, useEffect } from "react";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";
import MDXContent from "@/components/MDXContent";
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
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center pt-[60px]">
        <div className="flex mx-auto w-full max-w-7xl">
          {/* Left sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="fixed w-64 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
              <DocsSidebar
                product={product}
                section={section}
                currentSlug={slug}
                currentGroup={group}
                docs={[]}
              />
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
      <div className="flex justify-center" style={{ paddingTop: "60px" }}>
        <div className="flex mx-auto w-full max-w-7xl">
          {/* Left sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="fixed w-64 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
              <DocsSidebar
                product={product}
                section={section}
                currentSlug={slug}
                currentGroup={group}
                docs={docs}
              />
            </div>
          </div>

          {/* Main content area with error message */}
          <div className="flex-1 min-w-0 py-20 flex flex-col items-center justify-center px-8">
            <h1 className="text-2xl font-medium mb-4">Document Not Found</h1>
            <p className="text-gray-500">
              {error || "The document you're looking for doesn't exist."}
            </p>
            {errorDetails && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
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
    <div className="flex justify-center" style={{ paddingTop: "60px" }}>
      <div className="flex mx-auto w-full max-w-7xl">
        {/* Left sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="fixed w-64 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
            <DocsSidebar
              product={product}
              section={section}
              currentSlug={slug}
              currentGroup={group}
              docs={docs}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-w-0 px-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-semibold mb-4">
              {document.meta.title}
            </h1>
            {document.meta.description &&
              document.meta.description.trim() !== "" && (
                <p className="text-gray-600 mb-6">
                  {document.meta.description}
                </p>
              )}
            <div
              id="doc-content"
              className="prose prose-slate max-w-none overflow-x-auto mdx-container"
            >
              <MDXContent source={document.content} useFunMode={funMode} />
            </div>
          </div>
        </div>

        {/* Right TOC sidebar */}
        <div className="w-56 flex-shrink-0 hidden lg:block">
          <div className="fixed w-56 max-h-[calc(100vh-60px)] overflow-y-auto">
            <div className="px-4">
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

                <h4 className="text-sm font-medium text-gray-500">
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
