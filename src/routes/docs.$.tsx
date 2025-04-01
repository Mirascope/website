import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getDoc, getDocsForProduct } from "@/lib/docs";
import MDXContent from "@/components/MDXContent";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";

export const Route = createFileRoute("/docs/$")({
  component: DocsPage,
  // This is now a fallback route - it should only match if the more specific routes don't
  validateParams: ({ _splat }) => {
    // Parse the path into parts
    const pathParts = _splat.split('/').filter(Boolean);
    
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
  const pathParts = _splat.split('/').filter(Boolean);
  const product = pathParts[0] || '';
  
  // Extract current slug (last part) for sidebar highlighting
  const currentSlug = pathParts.length > 1 ? pathParts[pathParts.length - 1] : 'index';
  
  // Extract section and group if they exist
  let section = null;
  let group = null;
  
  // If we have a path like /docs/mirascope/api/llm/generation
  // product = mirascope, section = api, group = llm, slug = generation
  if (pathParts.length >= 3 && pathParts[1] === 'api') {
    section = 'api';
    if (pathParts.length >= 4) {
      group = pathParts[2];
    }
  } 
  // If we have a path like /docs/mirascope/getting-started/quickstart
  // product = mirascope, section = null, group = getting-started, slug = quickstart
  else if (pathParts.length >= 3) {
    group = pathParts[1];
  }
  
  const [document, setDocument] = useState<{ meta: any; content: string } | null>(null);
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
          // Get the document with a fallback system
          let doc = null;
          
          // Check if this is the root path or product path without a trailing slash
          if (_splat === '' || (!_splat.includes('/') && !_splat.endsWith('/'))) {
            // Add /index to handle the index case properly
            const indexPath = _splat ? `${fullPath}/index` : `${fullPath}index`;
            console.log(`[DocsPage] Trying explicit index path: ${indexPath}`);
            try {
              doc = await getDoc(indexPath);
              console.log(`[DocsPage] Successfully loaded explicit index document`);
            } catch (indexError) {
              console.log(`[DocsPage] Explicit index not found, trying normal path`);
              // Fall back to the normal path
              doc = await getDoc(fullPath);
            }
          } else {
            // For other paths, try the exact path first
            try {
              doc = await getDoc(fullPath);
            } catch (exactPathError) {
              console.log(`[DocsPage] Exact path not found, trying index fallback`);
              
              // If the path doesn't end with a slash and doesn't have a specific file,
              // try to load the index.mdx from that directory
              if (!_splat.endsWith('/') && !_splat.endsWith('.mdx')) {
                try {
                  const indexPath = `${fullPath}/`;
                  doc = await getDoc(indexPath);
                  console.log(`[DocsPage] Successfully loaded index document with trailing slash`);
                } catch (indexError) {
                  // If index doesn't exist either, throw the original error
                  console.error(`[DocsPage] Index not found either`, indexError);
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
          
          // Check for empty content and provide fallback
          if (!doc.content || doc.content.trim() === "") {
            console.warn(`[DocsPage] Empty content for ${fullPath}, using fallback`);
            doc.content = `# ${doc.meta.title || 'Documentation'}\n\n*Content not available yet.*`;
          }
          
          console.log(`[DocsPage] Document loaded successfully: ${doc.meta.title}`);
          setDocument(doc);
          setLoading(false);
        } catch (fetchErr) {
          console.error(`[DocsPage] Error fetching document: ${fetchErr.message}`);
          
          // If this is a product landing page, create a fallback
          if (pathParts.length <= 1) {
            console.log(`[DocsPage] Creating product landing page fallback`);
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
                slug: 'index',
                path: product,
                product,
                type: "item"
              },
              content: welcomeContent
            });
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

  if (error || !document) {
    // Document fetch failure
    
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
                docs={productDocs}
              />
            </div>
          </div>

          {/* Main content area with error message */}
          <div className="w-[1000px] flex-shrink-0 py-20 flex flex-col items-center justify-center pl-8">
            <h1 className="text-2xl font-medium mb-4">Document Not Found</h1>
            <p className="text-gray-500">
              {error || `The document at path "${_splat}" could not be loaded.`}
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
              <p>Looking for file: /src/docs/{_splat}.mdx</p>
              <p className="mt-2">Debug info:</p>
              <ul className="list-disc ml-5 mt-1">
                <li>Path: {_splat}</li>
                <li>Product: {product}</li>
                {section && <li>Section: {section}</li>}
                {group && <li>Group: {group}</li>}
                <li>Slug: {currentSlug}</li>
                <li>Expected path: /src/docs/{_splat}.mdx</li>
              </ul>
            </div>
          </div>

          {/* Right TOC sidebar - empty during error state */}
          <div className="w-64 flex-shrink-0 hidden lg:block"></div>
        </div>
      </div>
    );
  }
  
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
              docs={productDocs}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="w-[1000px] flex-shrink-0 pt-6 pl-8">
          <h1 className="text-3xl font-medium mb-4">{document.meta.title}</h1>
          {document.meta.description && document.meta.description.trim() !== "" && (
            <p className="text-gray-600 mb-6">{document.meta.description}</p>
          )}
          <div id="doc-content" className="prose prose-slate max-w-none">
            <MDXContent source={document.content} />
          </div>
        </div>

        {/* Right TOC sidebar */}
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <div className="fixed w-64 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
            <div className="px-4 pt-6">
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
  );
}