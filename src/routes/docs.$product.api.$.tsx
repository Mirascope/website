import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getDoc, getDocsForProduct } from "@/lib/docs";
import MDXContent from "@/components/MDXContent";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";

export const Route = createFileRoute("/docs/$product/api/$")({
  component: DocsApiPage,
});

function DocsApiPage() {
  // Get the product and API path
  const { product, _splat } = useParams({ from: "/docs/$product/api/$" });
  
  // Parse the path into group/slug components
  const pathParts = _splat.split('/').filter(Boolean);
  
  // For API routes, the section is always 'api'
  const section = 'api';
  
  // Extract group if it exists (first part of the splat)
  const group = pathParts.length > 0 ? pathParts[0] : null;
  
  // Extract current slug (last part) for sidebar highlighting
  const currentSlug = pathParts.length > 0 ? pathParts[pathParts.length - 1] : 'index';
  
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
        const fullPath = `/docs/${product}/api/${_splat}`;
        console.log(`[DocsApiPage] Full path: ${fullPath}, Product: ${product}, Section: ${section}, Group: ${group}, Slug: ${currentSlug}`);
        
        try {
          // Get the document with a fallback system
          let doc = null;
          
          // Check if this is an API index page
          if (_splat === '' || _splat === '/') {
            // API section landing page
            const indexPath = `/docs/${product}/api/index`;
            try {
              doc = await getDoc(indexPath);
              console.log(`[DocsApiPage] Successfully loaded API index`);
            } catch (indexError) {
              console.log(`[DocsApiPage] API index not found, trying normal path`);
              doc = await getDoc(fullPath);
            }
          } else {
            // For all other API paths, try the exact path
            try {
              doc = await getDoc(fullPath);
            } catch (exactPathError) {
              console.log(`[DocsApiPage] Exact API path not found, trying index fallback`);
              
              // If the path doesn't end with a slash, try with /index
              if (!_splat.endsWith('/') && !_splat.endsWith('.mdx')) {
                try {
                  const indexPath = `${fullPath}/index`;
                  doc = await getDoc(indexPath);
                  console.log(`[DocsApiPage] Successfully loaded API index document for sub-path`);
                } catch (indexError) {
                  // If index doesn't exist either, throw the original error
                  console.error(`[DocsApiPage] API index not found either`, indexError);
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
            console.warn(`[DocsApiPage] Empty content for ${fullPath}, using fallback`);
            doc.content = `# ${doc.meta.title || 'API Documentation'}\n\n*Content not available yet.*`;
          }
          
          console.log(`[DocsApiPage] Document loaded successfully: ${doc.meta.title}`);
          setDocument(doc);
          setLoading(false);
        } catch (fetchErr) {
          console.error(`[DocsApiPage] Error fetching document: ${fetchErr.message}`);
          
          // If this is the API landing page, create a fallback
          if (_splat === '' || _splat === '/') {
            console.log(`[DocsApiPage] Creating API landing page fallback`);
            const title = `${product.charAt(0).toUpperCase() + product.slice(1)} API Documentation`;
            const description = "";
            
            // Create content with frontmatter
            const apiContent = `---
title: ${title}
description: ${description}
---

# ${title}

${description}. Explore the API documentation using the sidebar.`;
            
            setDocument({
              meta: {
                title,
                description,
                slug: 'index',
                path: `${product}/api`,
                product,
                section,
                type: "section-item"
              },
              content: apiContent
            });
            setLoading(false);
            return;
          }
          
          throw fetchErr;
        }
      } catch (err) {
        console.error(`[DocsApiPage] Failed to load document: ${err.message}`);
        setError(`Failed to load document: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [_splat, product, section, group, currentSlug]);

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
            <h1 className="text-2xl font-medium mb-4">API Document Not Found</h1>
            <p className="text-gray-500">
              {error || `The API document at path "${_splat}" could not be loaded.`}
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
              <p>Looking for file: /src/docs/{product}/api/{_splat}.mdx</p>
              <p className="mt-2">Debug info:</p>
              <ul className="list-disc ml-5 mt-1">
                <li>Path: {_splat}</li>
                <li>Product: {product}</li>
                <li>Section: {section}</li>
                {group && <li>Group: {group}</li>}
                <li>Slug: {currentSlug}</li>
                <li>Expected path: /src/docs/{product}/api/{_splat}.mdx</li>
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