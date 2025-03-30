import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getDoc, getDocsForSection } from "@/lib/docs";
import type { DocMeta } from "@/lib/docs";
import MDXContent from "@/components/MDXContent";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";

export const Route = createFileRoute("/docs/$product/$section/$group/$slug")({
  component: DocSectionGroupPage,
  beforeLoad: ({ params }) => {
    console.log(
      `[Section-Group Route] beforeLoad: product=${params.product}, section=${params.section}, group=${params.group}, slug=${params.slug}`
    );
  },
  validateParams: ({ product, section, group, slug }) => {
    console.log(
      `[Section-Group Route] Validating: product=${product}, section=${section}, group=${group}, slug=${slug}`
    );
    
    // Import metadata for validation
    const docsMetadata = require("@/docs/_meta").default;
    const productData = docsMetadata[product];
    
    if (!productData) {
      console.error(`[Section-Group Route] Product not found: ${product}`);
      return false;
    }
    
    // Check if "section" is actually a top-level group
    if (productData.groups && productData.groups[section]) {
      console.error(`[Section-Group Route] "${section}" is a top-level group, not a section. Rejecting match.`);
      return false;
    }
    
    // Validate that section exists
    const sectionData = productData.sections?.[section];
    if (!sectionData) {
      console.error(`[Section-Group Route] Section not found: ${section} in product ${product}`);
      return false;
    }
    
    // Validate that group exists in this section
    const groupData = sectionData.groups?.[group];
    if (!groupData) {
      console.error(`[Section-Group Route] Group not found: ${group} in section ${section}`);
      return false;
    }
    
    // Validate that item exists in this group
    // Special case for index paths: allow them even if not explicitly defined
    const isIndexPath = slug === "index" || slug === "" || slug === "overview";
    const itemExists = groupData.items?.[slug];
    
    if (!itemExists && !isIndexPath) {
      console.error(`[Section-Group Route] Item not found: ${slug} in group ${group}`);
      return false;
    }
    
    console.log(`[Section-Group Route] Successfully validated path: ${product}/${section}/${group}/${slug}`);
    return { product, section, group, slug };
  },
});

function DocSectionGroupPage() {
  const { product, section, group, slug } = useParams({
    from: "/docs/$product/$section/$group/$slug",
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
      console.log(`[Section-Group Page] Loading document: ${product}/${section}/${group}/${slug}`);

      try {
        // Load section docs for the sidebar (includes all groups)
        const docsInSection = getDocsForSection(product, section);
        console.log(`[Section-Group Page] Loaded ${docsInSection.length} docs for section ${section}`);
        setSectionDocs(docsInSection);

        // Check if the document exists in the metadata
        const metadata = require("@/docs/_meta").default;
        const itemExists = metadata[product]?.sections?.[section]?.groups?.[group]?.items?.[slug];
        console.log(`[Section-Group Page] Item exists in metadata: ${!!itemExists}`);

        // Load the current document
        console.log(`[Section-Group Page] Attempting to load document: ${product}/${section}/${group}/${slug}`);
        try {
          const doc = await getDoc(product, { section, group, slug });
          console.log(`[Section-Group Page] Successfully loaded document: ${doc.meta.title}`);
          setDocument(doc);
        } catch (docErr) {
          console.error(`[Section-Group Page] Error loading document: ${docErr.message}`);
          
          // Create placeholder content if file not found but metadata exists
          const productData = metadata[product];
          const sectionData = productData?.sections?.[section];
          const groupData = sectionData?.groups?.[group];
          
          if (groupData && groupData.items && groupData.items[slug]) {
            const itemData = groupData.items[slug];
            console.log(`[Section-Group Page] Creating placeholder content from metadata for ${product}/${section}/${group}/${slug}`);
            
            const meta: DocMeta = {
              title: itemData.title,
              description: itemData.description || `${itemData.title} documentation`,
              slug,
              path: `${product}/${section}/${group}/${slug}`,
              product,
              type: "section-group-item",
              section,
              group,
              sectionTitle: sectionData.title,
              groupTitle: groupData.title
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
            console.error(`[Section-Group Page] Item not found in metadata: ${product}/${section}/${group}/${slug}`);
            setError(`Item "${slug}" not found in group "${group}" in section "${section}"`);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error(`[Section-Group Page] Error loading document:`, err);
        setError(`Failed to load document: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [product, section, group, slug]);

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
                currentSlug={slug}
                docs={sectionDocs}
                currentGroup={group}
              />
            </div>
          </div>

          {/* Main content area with error message */}
          <div className="w-[1000px] flex-shrink-0 py-20 px-8 flex flex-col items-center justify-center">
            <h1 className="text-2xl font-medium mb-4">Document Not Found</h1>
            <p className="text-gray-500">
              {error || "The document you're looking for doesn't exist."}
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
              currentSlug={slug}
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
                slug={slug}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
