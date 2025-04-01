import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getDoc, getDocsForProduct } from "@/lib/docs";
import { MDXRenderer } from "@/components/MDXRenderer";
import { processMDX } from "@/lib/mdx-utils";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";

export const Route = createFileRoute("/docs/$")({
  component: DocsPage,
  // This is now a fallback route - it should only match if the more specific routes don't
  validateParams: ({ _splat }) => {
    // Parse the path into parts
    const pathParts = _splat.split("/").filter(Boolean);

    // Only match if there's no product part (empty path) or for the root /docs/ page
    if (pathParts.length === 0) {
      return { _splat };
    }

    console.log(`[docs.$] Falling back to more specific routes for: ${_splat}`);
    // For all other cases, let the more specific routes handle it
    return false;
  },
});

function DocsPage() {
  // Get the full URL path after /docs/
  const { _splat } = useParams({ from: "/docs/$" });

  // Parse the path into product/section/group/slug components
  const pathParts = _splat.split("/").filter(Boolean);
  const product = pathParts[0] || "";

  // Extract current slug (last part) for sidebar highlighting
  const currentSlug =
    pathParts.length > 1 ? pathParts[pathParts.length - 1] : "index";

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

  const [document, setDocument] = useState<{
    meta: any;
    content: string;
  } | null>(null);
  const [compiledMDX, setCompiledMDX] = useState<{ code: string; frontmatter: Record<string, any> } | null>(null);
  const [productDocs, setProductDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load all docs for this product for the sidebar
        const docsForProduct = getDocsForProduct(product);
        setProductDocs(docsForProduct);

        // Log the process for debugging
        console.log(`[DocsPage] Loading document for path: /docs/${_splat}`);

        // Build full path for getDoc, ensuring it starts with a slash
        const fullPath = `/docs/${_splat}`;
        console.log(`[DocsPage] Full path: ${fullPath}`);

        try {
          // Check if this is an invalid document path that should display "Untitled Document"
          // This applies to paths like docs/mirascope/bad that don't exist in the docs structure
          // It also applies to unknown products like docs/unknown-product
          const pathIsInvalid =
            // Unknown product (docsForProduct will be empty)
            (pathParts.length > 0 && docsForProduct.length === 0) ||
            // Known product but unknown path
            (pathParts.length > 1 &&
              !docsForProduct.some(
                (doc) =>
                  // For paths like /docs/mirascope/bad we check if there's a matching slug
                  doc.slug === pathParts[pathParts.length - 1] ||
                  // For longer paths, check if the full path matches
                  doc.path === pathParts.join("/")
              ));

          if (pathIsInvalid) {
            console.log(
              `[DocsPage] Path appears to be invalid, creating "Untitled Document" fallback`
            );
            // Create a fallback doc with "Untitled Document" title
            const fallbackDoc = {
              meta: {
                title: "Untitled Document",
                description: "",
                slug: "",
                path: _splat,
                product,
                section,
                group,
                type: "item",
              },
              content: "", // Empty content as requested
            };

            setDocument(fallbackDoc);
            setLoading(false);
            return;
          }

          // Get the document with a fallback system
          let doc = null;

          // Check if this is the root path or product path without a trailing slash
          if (
            _splat === "" ||
            (!_splat.includes("/") && !_splat.endsWith("/"))
          ) {
            // Add /index to handle the index case properly
            const indexPath = _splat ? `${fullPath}/index` : `${fullPath}index`;
            console.log(`[DocsPage] Trying explicit index path: ${indexPath}`);
            try {
              doc = await getDoc(indexPath);
              console.log(
                `[DocsPage] Successfully loaded explicit index document`
              );
            } catch (indexError) {
              console.log(
                `[DocsPage] Explicit index not found, trying normal path`
              );
              // Fall back to the normal path
              doc = await getDoc(fullPath);
            }
          } else {
            // For other paths, try the exact path first
            try {
              doc = await getDoc(fullPath);
            } catch (exactPathError) {
              console.log(
                `[DocsPage] Exact path not found, trying index fallback`
              );

              // If the path doesn't end with a slash and doesn't have a specific file,
              // try to load the index.mdx from that directory
              if (!_splat.endsWith("/") && !_splat.endsWith(".mdx")) {
                try {
                  const indexPath = `${fullPath}/`;
                  doc = await getDoc(indexPath);
                  console.log(
                    `[DocsPage] Successfully loaded index document with trailing slash`
                  );
                } catch (indexError) {
                  // If index doesn't exist either, throw the original error
                  console.error(
                    `[DocsPage] Index not found either`,
                    indexError
                  );
                  throw exactPathError;
                }
              } else {
                // If it's already a specific path that failed, just throw the error
                throw exactPathError;
              }
            }
          }

          if (!doc) {
            throw new Error("Document is null or undefined");
          }

          // Check for empty content
          if (!doc.content || doc.content.trim() === "") {
            console.warn(
              `[DocsPage] Empty content for ${fullPath}, leaving empty as requested`
            );
            doc.content = "";
          }

          console.log(
            `[DocsPage] Document loaded successfully: ${doc.meta.title}`
          );
          setDocument(doc);
          setLoading(false);
        } catch (fetchErr) {
          console.error(
            `[DocsPage] Error fetching document: ${fetchErr.message}`
          );

          // If this is a product landing page, create a fallback
          if (pathParts.length <= 1) {
            console.log(`[DocsPage] Creating product landing page fallback`);

            // Check if this is a known product
            const isKnownProduct = product in docsMetadata;

            if (isKnownProduct) {
              // For known products, create a welcoming fallback
              const title = `${product.charAt(0).toUpperCase() + product.slice(1)} Documentation`;
              const description = "";

              // Create content with frontmatter
              const welcomeContent = `---
title: ${title}
description: ${description}
---

# ${title}

Get started with ${product} by exploring the documentation in the sidebar.`;

              setDocument({
                meta: {
                  title,
                  description,
                  slug: "index",
                  path: product,
                  product,
                  type: "item",
                },
                content: welcomeContent,
              });
            } else {
              // For unknown products, use "Untitled Document" with empty content
              setDocument({
                meta: {
                  title: "Untitled Document",
                  description: "",
                  slug: "",
                  path: product,
                  product,
                  type: "item",
                },
                content: "",
              });
            }

            setLoading(false);
            return;
          }

          throw fetchErr;
        }
      } catch (err) {
        console.error(`[DocsPage] Failed to load document: ${err.message}`);
        setError(`Failed to load document: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [_splat, product]);

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

  useEffect(() => {
    // When there's an error, we want to set document to a fallback with "Untitled Document"
    if (error) {
      console.log(
        `[DocsPage] Setting fallback "Untitled Document" due to error: ${error}`
      );
      setDocument({
        meta: {
          title: "Untitled Document",
          description: "",
          slug: "",
          path: _splat,
          product,
          section,
          group,
          type: "item",
        },
        content: "", // Empty content as requested
      });

      // Clear the error so we don't show any error state
      setError(null);
    }
  }, [error, _splat, product, section, group]);

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

  // Handle case when document is null but not in loading state
  if (!document) {
    const fallbackDocument = {
      meta: {
        title: "Untitled Document",
        description: "",
        slug: "",
        path: _splat,
        product,
        section,
        group,
        type: "item",
      },
      content: "", // Empty content for "nothing else" display
    };

    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Toggle sidebar for mobile
    const toggleSidebar = () => {
      setSidebarOpen(!sidebarOpen);
    };

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
                  currentSlug="" // Empty to prevent highlighting any specific page
                  currentGroup={group}
                  docs={productDocs}
                />
              </div>
            </div>

            {/* Main content area - full width on mobile */}
            <div className="flex-1 min-w-0 pt-6 lg:pl-8">
              {/* Title only - no content */}
              <h1 className="text-2xl lg:text-3xl font-medium mb-4">
                {fallbackDocument.meta.title}
              </h1>
              <div
                id="doc-content"
                className="prose prose-sm lg:prose-base prose-slate max-w-none"
              >
                {/* Empty content as requested */}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
              className="prose prose-sm lg:prose-base prose-slate max-w-none"
            >
              {document.content ? (
                compiledMDX ? (
                  <MDXRenderer 
                    code={compiledMDX.code} 
                    frontmatter={compiledMDX.frontmatter} 
                  />
                ) : (
                  <div className="animate-pulse bg-gray-100 h-40 rounded-md"></div>
                )
              ) : (
                <div></div> /* Empty div for no content */
              )}
            </div>
          </div>

          {/* Right TOC sidebar - hidden on all screens below lg */}
          <div className="w-64 flex-shrink-0 hidden lg:block">
            <div className="fixed w-64 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
              <div className="px-4 pt-12">
                <h4 className="text-sm font-medium mb-4 text-gray-500">
                  On this page
                </h4>
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
