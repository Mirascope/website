import { createFileRoute, useParams, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import docsMetadata from "@/docs/_meta";
import { getDoc, getDocsForSection } from "@/lib/docs";
import type { DocMeta } from "@/lib/docs";
import MDXContent from "@/components/MDXContent";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";

export const Route = createFileRoute("/docs/$product/$section/")({
  component: SectionIndexPage,
  beforeLoad: ({ params }) => {
    console.log(
      `[SECTION ROUTE] beforeLoad: product=${params.product}, section=${params.section}`
    );
  },
  validateParams: ({ product, section }) => {
    console.log(
      `[SECTION ROUTE] Validating section index route: product=${product}, section=${section}`
    );

    // Direct import to avoid circular dependencies
    const docsMetadata = require("@/docs/_meta").default;
    
    // Check if this is really a section or actually a top-level item
    const productData = docsMetadata[product];
    if (!productData) {
      console.error(`[SECTION ROUTE] Product not found: ${product}`);
      return false;
    }

    // If this is a top-level item and not a section, reject this route
    const isTopLevelItem = productData.items && productData.items[section];
    if (isTopLevelItem) {
      console.log(
        `[SECTION ROUTE] '${section}' is a top-level item, not a section. Rejecting match.`
      );
      return false;
    }

    // Verify the section exists in the metadata
    const isSectionValid =
      productData.sections && productData.sections[section];
    console.log(
      `[SECTION ROUTE] '${section}' is ${isSectionValid ? "a valid" : "NOT a valid"} section`
    );

    if (isSectionValid) {
      console.log(`[SECTION ROUTE] Successfully validated section: ${section}`);
      return { product, section };
    }

    console.error(`[SECTION ROUTE] Invalid section: ${section} not found in metadata`);
    return false;
  },
});

function SectionIndexPage() {
  const { product, section } = useParams({ from: "/docs/$product/$section/" });

  // Check if this "section" is actually a top-level page and redirect if needed
  const productData = docsMetadata[product];
  if (productData?.items && productData.items[section]) {
    console.log(
      `[Section Index] "${section}" is a top-level item, showing content directly`
    );

    // Instead of redirecting, we'll just show the content directly
    // This avoids any redirect loops
  }

  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<{
    meta: DocMeta;
    content: string;
  } | null>(null);
  const [sectionDocs, setSectionDocs] = useState<DocMeta[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      console.log(
        `[Section Index Effect] Loading content for ${product}/${section}`
      );

      try {
        // Check if this is actually a top-level item
        const productData = docsMetadata[product];
        const isTopLevelItem = productData?.items && productData.items[section];

        // Load docs for the sidebar
        const docsInSection = getDocsForSection(product, section);
        setSectionDocs(docsInSection);

        let doc;

        if (isTopLevelItem) {
          // If it's a top-level item, load it directly (not as a section)
          console.log(
            `[Section Index] Loading top-level item "${section}" directly`
          );
          doc = await getDoc(product, { slug: section });
        } else {
          // Regular section - load the section index page
          console.log(
            `[Section Index] Loading section index for ${product}/${section}`
          );

          try {
            // First attempt to load the explicit index.mdx file
            doc = await getDoc(product, { section, slug: "index" });
            console.log(`[Section Index] Loaded index.mdx for ${section}`);
          } catch (indexErr) {
            console.warn(
              `[Section Index] No index.mdx found for ${section}, creating placeholder`
            );
            
            // Generate placeholder content from metadata
            const sectionData = productData?.sections?.[section];
            
            if (sectionData) {
              const meta: DocMeta = {
                title: sectionData.title,
                description: sectionData.description || `${sectionData.title} documentation`,
                slug: "index",
                path: `${product}/${section}`,
                product,
                type: "section-item",
                section,
                sectionTitle: sectionData.title
              };
              
              // Get group links if they exist
              const groupLinks = sectionData.groups 
                ? Object.entries(sectionData.groups)
                  .map(([groupSlug, group]) => 
                    `- [${group.title}](/docs/${product}/${section}/${groupSlug}/)`
                  ).join("\n")
                : "";
                
              // Get direct section item links
              const itemLinks = sectionData.items && Object.keys(sectionData.items).length > 1 
                ? Object.entries(sectionData.items)
                  .filter(([slug]) => slug !== "index")
                  .map(([itemSlug, item]) => 
                    `- [${item.title}](/docs/${product}/${section}/${itemSlug})`
                  ).join("\n")
                : "";
              
              // Generate placeholder content
              const content = `---
title: ${meta.title}
description: ${meta.description}
---

# ${meta.title}

${meta.description || ""}

${groupLinks ? `## Groups\n\n${groupLinks}\n\n` : ""}
${itemLinks ? `## Pages\n\n${itemLinks}` : ""}
`;
              
              doc = { meta, content };
            } else {
              throw new Error(`Section ${section} not found in product ${product}`);
            }
          }
        }

        if (doc) {
          console.log(`[Section Index] Loaded document: "${doc.meta.title}"`);
          setDocument(doc);
        } else {
          console.error(
            `[Section Index] Document is null for ${product}/${section}`
          );
          setError("Failed to load document: Document is null");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading document:", err);
        setError(`Failed to load document: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [product, section]);

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
                currentSlug="index"
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
                currentSlug="index"
                docs={sectionDocs}
              />
            </div>
          </div>

          {/* Main content area with error message */}
          <div className="w-[1000px] flex-shrink-0 py-20 px-8 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-medium mb-4">
              Section Index Not Found
            </h1>
            <p className="text-gray-500">
              {error || `The index page for ${section} section doesn't exist.`}
            </p>
          </div>

          {/* Right TOC sidebar - empty during error state */}
          <div className="w-64 flex-shrink-0 hidden lg:block"></div>
        </div>
      </div>
    );
  }

  // Safety check for empty content
  if (!document.content || document.content.trim() === "") {
    console.error(
      "Document content is empty for section index:",
      product,
      section
    );
    document.content = `---
title: ${document.meta.title || section}
description: ${document.meta.description || `${section} documentation`}
---

# ${document.meta.title || section}

*This content is under development. Please check back soon for updates.*
`;
  }

  // Check if this is a top-level item
  // const productData = docsMetadata[product];
  const isTopLevelItem = productData?.items && productData.items[section];

  return (
    <div className="flex justify-center" style={{ paddingTop: "60px" }}>
      <div className="flex mx-auto w-[1400px]">
        {/* Left sidebar */}
        <div className="w-72 flex-shrink-0">
          <div className="fixed w-72 top-[60px] pt-6 max-h-[calc(100vh-60px)] overflow-y-auto">
            <DocsSidebar
              product={product}
              // For top-level items, don't pass section to sidebar
              section={isTopLevelItem ? null : section}
              // For top-level items, pass the section name as currentSlug
              // For section index pages, pass "index" to match the index item
              currentSlug={isTopLevelItem ? section : "index"}
              docs={sectionDocs}
            />
          </div>
        </div>

        {/* Main content area */}
        <div className="w-[1000px] flex-shrink-0 pt-6 px-8">
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
                // For top-level items, don't pass section to TOC
                section={isTopLevelItem ? null : section}
                // For top-level items, pass the section name as slug
                // For section index pages, pass "index" to match the index item
                slug={isTopLevelItem ? section : "index"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
