import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getDoc, getDocsForProduct } from "@/lib/docs";
import MDXContent from "@/components/MDXContent";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";

export const Route = createFileRoute("/docs/$product/$slug")({
  component: DocProductPage,
  validateParams: ({ product, slug }) => {
    console.log(`[SLUG ROUTE] Validating top-level route: product=${product}, slug=${slug}`);
    
    // Accept ALL routes for troubleshooting
    return { product, slug };
  },
});

function DocProductPage() {
  const { product, slug } = useParams({
    from: "/docs/$product/$slug",
  });

  const [document, setDocument] = useState<{ meta: any; content: string } | null>(null);
  const [productDocs, setProductDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      console.log(`[DocProductPage] Loading content for product=${product}, slug=${slug}`);
      setLoading(true);
      setError(null);

      try {
        // Load all docs for this product
        const docsForProduct = getDocsForProduct(product);
        setProductDocs(docsForProduct);
        console.log(`[DocProductPage] Loaded ${docsForProduct.length} docs for product`);

        // Load the document - this is a top-level item (no section or group)
        console.log(`[DocProductPage] Fetching content for ${product}/${slug}`);
        const doc = await getDoc(product, { slug });
        console.log(`[DocProductPage] Received document:`, doc);
        
        if (!doc) {
          throw new Error("Document is null or undefined");
        }
        
        if (!doc.content || doc.content.trim() === "") {
          console.warn(`[DocProductPage] Empty content received for ${product}/${slug}`);
        }
        
        setDocument(doc);
        setLoading(false);
      } catch (err) {
        console.error(`[DocProductPage] Error loading document for ${product}/${slug}:`, err);
        setError(`Failed to load document: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [product, slug]);

  if (loading) {
    return (
      <div className="flex justify-center" style={{ paddingTop: "60px" }}>
        <div className="flex mx-auto w-[1400px]">
          {/* Left sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="fixed w-72 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
              <DocsSidebar
                product={product}
                section={null}
                currentSlug={slug}
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
    // Add additional debugging for the document fetch failure
    console.error(`[DocProduct] Document fetch failed for ${product}/${slug}`, { error, document });
    
    return (
      <div className="flex justify-center" style={{ paddingTop: "60px" }}>
        <div className="flex mx-auto w-[1400px]">
          {/* Left sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="fixed w-72 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
              <DocsSidebar
                product={product}
                section={null}
                currentSlug={slug}
                docs={productDocs}
              />
            </div>
          </div>

          {/* Main content area with error message */}
          <div className="w-[1000px] flex-shrink-0 py-20 flex flex-col items-center justify-center pl-8">
            <h1 className="text-2xl font-medium mb-4">Document Not Found</h1>
            <p className="text-gray-500">
              {error || `The document "${slug}" in product "${product}" could not be loaded.`}
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
              <p>Looking for file: /src/docs/{product}/{slug}.mdx</p>
            </div>
          </div>

          {/* Right TOC sidebar - empty during error state */}
          <div className="w-64 flex-shrink-0 hidden lg:block"></div>
        </div>
      </div>
    );
  }

  // Extra safety check
  if (!document || !document.content) {
    console.error(`[DocProduct] Document missing or invalid for ${product}/${slug}`);
    return (
      <div className="flex justify-center" style={{ paddingTop: "60px" }}>
        <div className="flex mx-auto w-[1400px]">
          {/* Left sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="fixed w-72 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
              <DocsSidebar
                product={product}
                section={null}
                currentSlug={slug}
                docs={productDocs}
              />
            </div>
          </div>

          {/* Main content area with error message */}
          <div className="w-[1000px] flex-shrink-0 py-20 flex flex-col items-center justify-center pl-8">
            <h1 className="text-2xl font-medium mb-4">Document Error - Missing Content</h1>
            <p className="text-gray-500">
              The document content could not be loaded properly.
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
              <p>Document path: {product}/{slug}</p>
              <p className="mt-2">This is a debug message for troubleshooting purposes.</p>
            </div>
          </div>

          {/* Right TOC sidebar - empty during error state */}
          <div className="w-64 flex-shrink-0 hidden lg:block"></div>
        </div>
      </div>
    );
  }

  console.log(`[DocProduct] Rendering document for ${product}/${slug} with title "${document.meta.title}"`);
  
  return (
    <div className="flex justify-center" style={{ paddingTop: "60px" }}>
      <div className="flex mx-auto w-[1400px]">
        {/* Left sidebar */}
        <div className="w-72 flex-shrink-0">
          <div className="fixed w-72 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
            <DocsSidebar
              product={product}
              section={null}
              currentSlug={slug}
              docs={productDocs}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="w-[1000px] flex-shrink-0 pt-6 pl-8">
          <h1 className="text-3xl font-medium mb-4">{document.meta.title}</h1>
          {document.meta.description && (
            <p className="text-gray-600 mb-6">{document.meta.description}</p>
          )}
          <div id="doc-content" className="prose prose-slate max-w-none">
            <MDXContent source={document.content} />
          </div>
          <div className="mt-8 p-4 bg-gray-50 rounded-lg text-xs">
            <p>Debug info:</p>
            <p>Product: {product}</p>
            <p>Slug: {slug}</p>
            <p>Title: {document.meta.title}</p>
            <p>Content length: {document.content?.length || 0} characters</p>
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
                section={null}
                slug={slug}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}