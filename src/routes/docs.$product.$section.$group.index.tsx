import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import docsMetadata from "@/docs/_meta";
import { getDoc, getDocsForSection } from "@/lib/docs";
import type { DocMeta, DocType } from "@/lib/docs";
import MDXContent from "@/components/MDXContent";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";

export const Route = createFileRoute("/docs/$product/$section/$group/")({
  component: SectionGroupIndexPage,
  beforeLoad: ({ params }) => {
    console.log(
      `[SECTION-GROUP ROUTE] beforeLoad: product=${params.product}, section=${params.section}, group=${params.group}`
    );
  },
  validateParams: ({ product, section, group }) => {
    console.log(
      `[SECTION-GROUP ROUTE] Validating section-group index route: product=${product}, section=${section}, group=${group}`
    );

    // Import metadata for validation
    const docsMetadata = require("@/docs/_meta").default;
    const productData = docsMetadata[product];
    
    // If product doesn't exist, don't match this route
    if (!productData) {
      console.error(`[SECTION-GROUP ROUTE] Product not found: ${product}`);
      return false;
    }
    
    // First, check if "section" is actually a top-level group
    if (productData.groups && productData.groups[section]) {
      // When the user navigates to /docs/mirascope/getting-started/quickstart/
      // where "getting-started" is a group, not a section
      
      // If this is a group and quickstart is an item in that group, it should be handled by a different route
      console.error(`[SECTION-GROUP ROUTE] "${section}" is a top-level group, not a section. Rejecting match.`);
      return false;
    }
    
    // Verify the section exists in the metadata
    const sectionData = productData.sections?.[section];
    if (!sectionData) {
      console.error(`[SECTION-GROUP ROUTE] Section not found: ${section} in product ${product}`);
      return false;
    }
    
    // Verify that group exists in this section
    const groupData = sectionData.groups?.[group];
    if (!groupData) {
      console.error(`[SECTION-GROUP ROUTE] Group not found: ${group} in section ${section}`);
      return false;
    }
    
    console.log(`[SECTION-GROUP ROUTE] Successfully validated path: ${product}/${section}/${group}/`);
    return { product, section, group };
  },
});

function SectionGroupIndexPage() {
  const { product, section, group } = useParams({
    from: "/docs/$product/$section/$group/",
  });

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
        `[Section-Group Index Effect] Loading content for ${product}/${section}/${group}/`
      );

      try {
        // Load docs for the sidebar
        const docsInSection = getDocsForSection(product, section);
        console.log(`[Section-Group Index] Loaded ${docsInSection.length} docs for section ${section}`);
        setSectionDocs(docsInSection);

        try {
          // First attempt to load the explicit index.mdx file
          const doc = await getDoc(product, { section, group, slug: "index" });
          console.log(`[Section-Group Index] Successfully loaded index.mdx for ${section}/${group}`);
          setDocument(doc);
        } catch (indexErr) {
          console.warn(
            `[Section-Group Index] No index.mdx found for ${section}/${group}, creating placeholder`
          );
          
          // Create a placeholder with metadata from the group
          const productData = docsMetadata[product];
          const groupData = productData?.sections?.[section]?.groups?.[group];
          
          if (!groupData) {
            throw new Error(`Group ${group} not found in section ${section}`);
          }
          
          // Generate metadata for the index page
          const meta = {
            title: groupData.title,
            description: groupData.description || `${groupData.title} documentation`,
            slug: "index",
            path: `${product}/${section}/${group}`,
            product,
            type: "section-group-item" as DocType,
            section,
            group,
            sectionTitle: productData?.sections?.[section]?.title || section,
            groupTitle: groupData.title,
          };
          
          // Generate placeholder content
          const content = `---
title: ${meta.title}
description: ${meta.description}
---

# ${meta.title}

${meta.description || ""}

## Available Documentation

${Object.entries(groupData.items || {})
  .map(([itemSlug, item]) => `- [${item.title}](/docs/${product}/${section}/${group}/${itemSlug})`)
  .join("\n")}
`;
          
          setDocument({ meta, content });
        }

        setLoading(false);
      } catch (err) {
        console.error(`[Section-Group Index] Error loading document:`, err);
        setError(`Failed to load document: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [product, section, group]);

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
                currentGroup={group}
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
                currentGroup={group}
              />
            </div>
          </div>

          {/* Main content area with error message */}
          <div className="w-[1000px] flex-shrink-0 py-20 px-8 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-medium mb-4">
              Group Index Not Found
            </h1>
            <p className="text-gray-500">
              {error || `The index page for ${section}/${group} doesn't exist.`}
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
              section={section}
              currentSlug="index"
              docs={sectionDocs}
              currentGroup={group}
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
                section={section}
                slug="index"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}