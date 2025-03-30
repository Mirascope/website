import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getDoc, getDocsForGroup } from "@/lib/docs";
import type { DocMeta } from "@/lib/docs";
import MDXContent from "@/components/MDXContent";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";

export const Route = createFileRoute("/docs/$product/$group/$slug")({
  component: DocGroupPage,
  beforeLoad: ({ params }) => {
    console.log(
      `[Group Route] beforeLoad: product=${params.product}, group=${params.group}, slug=${params.slug}`
    );
  },
  validateParams: ({ product, group, slug }) => {
    console.log(`[Group Route] Validating group route: product=${product}, group=${group}, slug=${slug}`);
    
    // Import directly to avoid circular dependencies
    const docsMetadata = require("@/docs/_meta").default;
    const productData = docsMetadata[product];
    
    if (!productData) {
      console.error(`[Group Route] Product not found: ${product}`);
      return false;
    }
    
    // If this "group" is actually a section, reject this route match 
    // and let the section route handle it
    if (productData.sections && productData.sections[group]) {
      console.log(`[Group Route] "${group}" is actually a section in metadata, not a group. Rejecting match.`);
      return false;
    }
    
    // Verify that this is a valid group in the product's top-level groups
    const groupExists = productData.groups && productData.groups[group];
    if (!groupExists) {
      console.error(`[Group Route] Group not found: ${group} in product ${product}`);
      return false;
    }
    
    // If this is the index page for a group, reject this route and let the index route handle it
    if (slug === "index" || slug === "" || slug === "overview") {
      console.log(`[Group Route] This is a group index page for ${group}, letting docs.$product.$group.index route handle it`);
      return false;
    }
    
    // Verify that the item exists in this group
    const itemExists = productData.groups[group]?.items?.[slug];
    if (!itemExists) {
      console.error(`[Group Route] Item not found: ${slug} in group ${group}`);
      return false;
    }
    
    console.log(`[Group Route] Successfully validated path: ${product}/${group}/${slug}`);
    return { product, group, slug };
  },
});

function DocGroupPage() {
  const { product, group, slug } = useParams({
    from: "/docs/$product/$group/$slug",
  });

  const [document, setDocument] = useState<{
    meta: DocMeta;
    content: string;
  } | null>(null);
  const [groupDocs, setGroupDocs] = useState<DocMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load group docs for the sidebar
        const docsInGroup = getDocsForGroup(product, group);
        setGroupDocs(docsInGroup);

        // Load the current document
        console.log(`[Group Route] Loading document for ${product}/${group}/${slug}`);
        try {
          const doc = await getDoc(product, { group, slug });
          console.log(`[Group Route] Loaded document: ${doc.meta.title}`);
          setDocument(doc);
        } catch (docErr) {
          console.error(`[Group Route] Error loading document: ${docErr.message}`);
          
          // Create placeholder content if file not found
          const productData = docsMetadata[product];
          const groupData = productData?.groups?.[group];
          
          if (groupData && groupData.items && groupData.items[slug]) {
            const itemData = groupData.items[slug];
            console.log(`[Group Route] Creating placeholder content for ${product}/${group}/${slug}`);
            
            const meta: DocMeta = {
              title: itemData.title,
              description: itemData.description || `${itemData.title} documentation`,
              slug,
              path: `${product}/${group}/${slug}`,
              product,
              type: "group-item",
              group,
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
            console.error(`[Group Route] Item not found in _meta.ts: ${product}/${group}/${slug}`);
            setError(`Item "${slug}" not found in group "${group}"`);
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
  }, [product, group, slug]);

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
                section={null}
                currentSlug={slug}
                docs={[]}
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
              section={null}
              currentSlug={slug}
              docs={[]} 
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