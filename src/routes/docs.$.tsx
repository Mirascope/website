import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useDoc, getDocsForProduct } from "@/lib/content/docs";
import { MDXRenderer } from "@/components/MDXRenderer";
import { DocsSidebar } from "@/components/docs";
import TableOfContents from "@/components/TableOfContents";
import { type ProductName } from "@/lib/route-types";

export const Route = createFileRoute("/docs/$")({
  component: DocsPage,
});

function DocsPage() {
  const { _splat = "" } = useParams({ from: "/docs/$" });

  const pathParts = _splat.split("/").filter(Boolean);
  // Type assertion needed for ProductName - invalid products are handled in the fetchData try/catch
  const product = (pathParts[0] || "") as ProductName;

  // Extract current slug (last part) for sidebar highlighting
  const currentSlug = pathParts.length > 1 ? pathParts[pathParts.length - 1] : "index";

  // Extract section and group if they exist
  let section = null;
  let group = null;

  // If we have a path like /docs/mirascope/api/llm/generation
  // product = mirascope, section = api, group = llm, slug = generation
  if (pathParts.length >= 3 && pathParts[1] === "api") {
    section = "api";
    if (pathParts.length >= 4) {
      group = pathParts[2];
    }
  }
  // If we have a path like /docs/mirascope/getting-started/quickstart
  // product = mirascope, section = null, group = getting-started, slug = quickstart
  else if (pathParts.length >= 3) {
    group = pathParts[1];
  }

  // Build full path for useDoc
  const docPath = _splat || product;

  // Use the useDoc hook to fetch and process document
  const { content: document, loading } = useDoc(docPath);
  const [productDocs, setProductDocs] = useState<any[]>([]);

  // Fetch product docs for the sidebar
  useEffect(() => {
    try {
      // Load all docs for this product for the sidebar
      const docsForProduct = getDocsForProduct(product);
      setProductDocs(docsForProduct);
    } catch (err) {
      console.error(`[DocsPage] Failed to load product docs: ${err}`);
      setProductDocs([]);
    }
  }, [product]);

  if (loading) {
    return (
      <div className="flex justify-center" style={{ paddingTop: "60px" }}>
        <div className="flex mx-auto w-[1400px]">
          {/* Left sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="fixed w-72 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
              <DocsSidebar
                product={product}
                section={section}
                currentSlug={currentSlug}
                currentGroup={group}
                docs={[]}
              />
            </div>
          </div>

          {/* Main content area with loading spinner */}
          <div className="w-[1000px] flex-shrink-0 flex justify-center items-center py-20 pl-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>

          {/* Right TOC sidebar - empty during loading */}
          <div className="w-64 flex-shrink-0 hidden lg:block"></div>
        </div>
      </div>
    );
  }

  // Set up mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex justify-center" style={{ paddingTop: "60px" }}>
        <div className="flex mx-auto w-[1400px]">
          {/* Left sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="fixed w-72 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
              <DocsSidebar
                product={product}
                section={section}
                currentSlug=""
                currentGroup={group}
                docs={productDocs}
              />
            </div>
          </div>

          {/* Main content area with loading spinner */}
          <div className="w-[1000px] flex-shrink-0 flex justify-center items-center py-20 pl-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>

          {/* Right TOC sidebar - empty during loading */}
          <div className="w-64 flex-shrink-0 hidden lg:block"></div>
        </div>
      </div>
    );
  }

  // Handle normal document rendering
  return (
    <div className="relative" style={{ paddingTop: "60px" }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      <div className="mx-auto px-4 lg:px-0 lg:max-w-[1400px]">
        {/* Mobile menu button */}
        <button
          className="fixed top-[70px] left-4 p-2 rounded-md bg-white shadow-md z-40 lg:hidden"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* Left sidebar - hidden on mobile, shown when sidebarOpen is true */}
          <div
            className={`
            fixed top-[60px] left-0 z-40 w-72 h-[calc(100vh-60px)]
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0 lg:relative lg:flex-shrink-0 
            transition-transform duration-300 ease-in-out
            bg-white
          `}
          >
            <div className="h-full pt-6 overflow-y-auto">
              <DocsSidebar
                product={product}
                section={section}
                currentSlug={currentSlug}
                currentGroup={group}
                docs={productDocs}
              />
            </div>
          </div>

          {/* Main content area - full width on mobile */}
          <div className="flex-1 min-w-0 pt-6 lg:pl-8">
            {/* Title and content */}
            <h1 className="text-2xl lg:text-3xl font-medium mb-4">
              {document?.meta?.title || "Document Not Found"}
            </h1>
            {document?.meta?.description && document.meta.description.trim() !== "" && (
              <p className="text-gray-600 mb-6">{document.meta.description}</p>
            )}
            <div id="doc-content" className="prose prose-sm lg:prose-base prose-slate max-w-none">
              {document?.mdx ? (
                <MDXRenderer code={document.mdx.code} frontmatter={document.mdx.frontmatter} />
              ) : (
                <div className="animate-pulse bg-gray-100 h-40 rounded-md"></div>
              )}
            </div>
          </div>

          {/* Right TOC sidebar - hidden on all screens below lg */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <div className="fixed w-64 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
              <div className="px-4 pt-12">
                <h4 className="text-sm font-medium mb-4 text-gray-500">On this page</h4>
                <TableOfContents
                  contentId="doc-content"
                  product={product}
                  section={section}
                  slug={currentSlug}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
