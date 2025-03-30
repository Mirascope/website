import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getDoc, getDocsForProduct } from "@/lib/docs";
import MDXContent from "@/components/MDXContent";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";

export const Route = createFileRoute("/docs/$product/")({
  component: ProductDocsIndexPage,
  beforeLoad: ({ params }) => {
    console.log(`Loading index page for product: ${params.product}`);
  }
});

function ProductDocsIndexPage() {
  const { product } = useParams({ from: "/docs/$product/" });
  
  const [document, setDocument] = useState<{ meta: any; content: string } | null>(null);
  const [productDocs, setProductDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      console.log(`[ProductIndex] Loading index page for ${product}`);

      try {
        // Load all docs for this product
        const docsForProduct = getDocsForProduct(product);
        setProductDocs(docsForProduct);

        // Try to load the index document first, if that fails, try welcome
        let doc;
        try {
          doc = await getDoc(product, { slug: "index" });
          console.log(`[ProductIndex] Loaded index document for ${product}:`, doc.meta.title);
        } catch (indexError) {
          // If index doesn't exist, try welcome as fallback
          console.log(`[ProductIndex] No index document found, trying welcome for ${product}`);
          doc = await getDoc(product, { slug: "welcome" });
        }
        console.log(`[ProductIndex] Loaded welcome document for ${product}:`, doc.meta.title);
        setDocument(doc);
        setLoading(false);
      } catch (err) {
        console.error("Error loading document:", err);
        setError(`Failed to load document: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
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
                section={null}
                currentSlug="welcome"
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
    return (
      <div className="flex justify-center" style={{ paddingTop: "60px" }}>
        <div className="flex mx-auto w-[1400px]">
          {/* Left sidebar */}
          <div className="w-72 flex-shrink-0">
            <div className="fixed w-72 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
              <DocsSidebar
                product={product}
                section={null}
                currentSlug="welcome"
                docs={productDocs}
              />
            </div>
          </div>

          {/* Main content area with error message */}
          <div className="w-[1000px] flex-shrink-0 py-20 flex flex-col items-center justify-center pl-8">
            <h1 className="text-2xl font-medium mb-4">Welcome Document Not Found</h1>
            <p className="text-gray-500">
              {error || "The welcome document for this product doesn't exist."}
            </p>
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
              section={null}
              currentSlug="welcome"
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
                slug="welcome"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}