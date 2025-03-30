import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getDoc, getDocsForSection, getSectionsForProduct } from "@/lib/docs";
import type { DocMeta } from "@/lib/docs";
import MDXContent from "@/components/MDXContent";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";

export const Route = createFileRoute("/docs/$product/$section/$slug")({
  component: DocSectionPage,
  validateParams: ({ product, section, slug }) => {
    console.log(`[Section Route] Validating section route: product=${product}, section=${section}, slug=${slug}`);
    
    // Check if this is really a section (and not a top-level item incorrectly interpreted as a section)
    // Import directly to avoid circular dependencies
    const docsMetadata = require("@/docs/_meta").default;
    
    const productData = docsMetadata[product];
    if (!productData) {
      console.error(`[Section Route] Product not found: ${product}`);
      return false;
    }
    
    // Special case: If this is a top-level item like "migration", don't handle it here
    const isTopLevelItem = productData.items && productData.items[section];
    if (isTopLevelItem) {
      console.log(`[Section Route] '${section}' is a top-level item, not a section. Rejecting match.`);
      return false;
    }
    
    // Special case: If this is a top-level group like "getting-started", don't handle it here
    const isTopLevelGroup = productData.groups && productData.groups[section];
    if (isTopLevelGroup) {
      console.log(`[Section Route] '${section}' is a top-level group, not a section. Rejecting match.`);
      return false;
    }
    
    // Verify the section exists in the metadata
    const isSectionValid = productData.sections && productData.sections[section];
    console.log(`[Section Route] '${section}' is ${isSectionValid ? 'a valid' : 'NOT a valid'} section`);
    
    if (isSectionValid) {
      // For sections, also check that the slug is valid (if not index/overview)
      const isIndexPath = slug === "index" || slug === "" || slug === "overview";
      const itemExists = productData.sections[section]?.items?.[slug];
      
      if (!isIndexPath && !itemExists) {
        console.error(`[Section Route] Item '${slug}' not found in section '${section}'`);
        // Still allow this to pass, we'll handle the error in the component
      }
      
      return { product, section, slug };
    }
    
    return false;
  },
});

function DocSectionPage() {
  const { product, section, slug } = useParams({
    from: "/docs/$product/$section/$slug",
  });

  const [document, setDocument] = useState<{
    meta: DocMeta;
    content: string;
  } | null>(null);
  const [sectionDocs, setSectionDocs] = useState<DocMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load section docs for the sidebar
        const docsInSection = getDocsForSection(product, section);
        setSectionDocs(docsInSection);

        // Load the current document
        try {
          const doc = await getDoc(product, { section, slug });
          console.log(`[Section Route] Loaded document: ${doc.meta.title}`);
          setDocument(doc);
        } catch (docErr) {
          console.error(`[Section Route] Error loading document: ${docErr.message}`);
          
          // Create placeholder content if file not found but metadata exists
          const metadata = require("@/docs/_meta").default;
          const productData = metadata[product];
          const sectionData = productData?.sections?.[section];
          
          if (sectionData && sectionData.items && sectionData.items[slug]) {
            const itemData = sectionData.items[slug];
            console.log(`[Section Route] Creating placeholder content from metadata for ${product}/${section}/${slug}`);
            
            const meta: DocMeta = {
              title: itemData.title,
              description: itemData.description || `${itemData.title} documentation`,
              slug,
              path: `${product}/${section}/${slug}`,
              product,
              type: "section-item",
              section,
              sectionTitle: sectionData.title
            };
            
            const content = `---
title: ${meta.title}
description: ${meta.description}
---

# ${meta.title}

${meta.description || ""}

*This page is under construction. Content will be available soon.*`;
            
            setDocument({ meta, content });
          } else {
            console.error(`[Section Route] Item not found in metadata: ${product}/${section}/${slug}`);
            setError(`Item "${slug}" not found in section "${section}"`);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading document:", err);
        setError(`Failed to load document: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [product, section, slug]);

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
                currentSlug={slug}
                docs={[]}
              />
            </div>
          </div>

          {/* Main content area with loading spinner */}
          <div className="w-[1000px] flex-shrink-0 flex justify-center items-center py-20 px-8">
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
                section={section}
                currentSlug={slug}
                docs={sectionDocs}
              />
            </div>
          </div>

          {/* Main content area with error message and debug info */}
          <div className="w-[1000px] flex-shrink-0 py-20 px-8 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-medium mb-4">Document Not Found</h1>
            <p className="text-gray-500">
              {error || "The document you're looking for doesn't exist."}
            </p>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left w-full max-w-lg">
              <h3 className="text-lg font-medium mb-2">Debug Information</h3>
              <pre className="text-xs overflow-auto">
                {`Product: ${product}
Section: ${section}
Slug: ${slug}
Expected path: /src/docs/${product}/${section}/${slug}.mdx`}
              </pre>
            </div>
          </div>

          {/* Right TOC sidebar - empty during error state */}
          <div className="w-64 flex-shrink-0 hidden lg:block"></div>
        </div>
      </div>
    );
  }

  // Safety check for empty content
  if (!document.content || document.content.trim() === "") {
    console.error("Document content is empty for:", product, section, slug);
    // Use a sensible fallback
    document.content = `---
title: ${document.meta.title || "Documentation"}
description: ${document.meta.description || "Content coming soon"}
---

# ${document.meta.title || "Documentation"}

${document.meta.description || "Content is being developed. Please check back soon."}
`;
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
              currentSlug={slug}
              docs={sectionDocs}
            />
          </div>
        </div>

        {/* Main content area - wider width */}
        <div className="w-[1000px] flex-shrink-0 pt-0 px-8 -mt-12">
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
                section={section}
                slug={slug}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}