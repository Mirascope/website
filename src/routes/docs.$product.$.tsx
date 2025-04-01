import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getDoc, getDocsForProduct } from "@/lib/docs";
import MDXContent from "@/components/MDXContent";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";

export const Route = createFileRoute("/docs/$product/$")({
  component: DocsProductPage,
  // Don't match if the next part is "api" - that's handled by docs.$product.api.$.tsx
  validateParams: ({ product, _splat }) => {
    // Skip API routes - those are handled by the API route
    if (_splat.startsWith('api/')) {
      return false;
    }
    return { product, _splat };
  },
});

function DocsProductPage() {
  // Get the product and remaining path
  const { product, _splat } = useParams({ from: "/docs/$product/$" });
  
  // Parse the path into group/slug components
  const pathParts = _splat.split('/').filter(Boolean);
  
  // Extract group if it exists (first part of the splat)
  const group = pathParts.length > 0 ? pathParts[0] : null;
  
  // Extract current slug (last part) for sidebar highlighting
  const currentSlug = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'index';
  
  // No section for regular product routes
  const section = null;
  
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

        // Build the full path for getDoc
        const fullPath = `/docs/${product}/${_splat}`;
        console.log(`[DocsProductPage] Full path: ${fullPath}, Product: ${product}, Group: ${group}, Slug: ${currentSlug}`);
        
        try {
          // Get the document with a fallback system
          let doc = null;
          
          // Handle the index case (empty splat)
          if (_splat === '' || _splat === '/') {
            // Product landing page
            const indexPath = `/docs/${product}/index`;
            try {
              doc = await getDoc(indexPath);
              console.log(`[DocsProductPage] Successfully loaded product index`);
            } catch (indexError) {
              console.log(`[DocsProductPage] Product index not found, trying normal path`);
              doc = await getDoc(fullPath);
            }
          } else {
            // For other paths, try the exact path first
            try {
              doc = await getDoc(fullPath);
            } catch (exactPathError) {
              console.log(`[DocsProductPage] Exact path not found, trying index fallback`);
              
              // If the path doesn't end with a slash, try with /index
              if (!_splat.endsWith('/') && !_splat.endsWith('.mdx')) {
                try {
                  const indexPath = `${fullPath}/index`;
                  doc = await getDoc(indexPath);
                  console.log(`[DocsProductPage] Successfully loaded index document for sub-path`);
                } catch (indexError) {
                  // If index doesn't exist either, throw the original error
                  console.error(`[DocsProductPage] Index not found either`, indexError);
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
            console.warn(`[DocsProductPage] Empty content for ${fullPath}, using fallback`);
            doc.content = `# ${doc.meta.title || 'Documentation'}\n\n*Content not available yet.*`;
          }
          
          console.log(`[DocsProductPage] Document loaded successfully: ${doc.meta.title}`);
          setDocument(doc);
          setLoading(false);
        } catch (fetchErr) {
          console.error(`[DocsProductPage] Error fetching document: ${fetchErr.message}`);
          
          // If this is the product landing page, create a fallback
          if (_splat === '' || _splat === '/') {
            console.log(`[DocsProductPage] Creating product landing page fallback`);
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
        console.error(`[DocsProductPage] Failed to load document: ${err.message}`);
        setError(`Failed to load document: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [_splat, product, group, currentSlug]);

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
              <p>Looking for file: /src/docs/{product}/{_splat}.mdx</p>
              <p className="mt-2">Debug info:</p>
              <ul className="list-disc ml-5 mt-1">
                <li>Path: {_splat}</li>
                <li>Product: {product}</li>
                {group && <li>Group: {group}</li>}
                <li>Slug: {currentSlug}</li>
                <li>Expected path: /src/docs/{product}/{_splat}.mdx</li>
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