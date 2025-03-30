import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import docsMetadata from "@/docs/_meta";
import { getDoc, getDocsForGroup } from "@/lib/docs";
import type { DocMeta, DocType } from "@/lib/docs";
import MDXContent from "@/components/MDXContent";
import DocsSidebar from "@/components/DocsSidebar";
import TableOfContents from "@/components/TableOfContents";

export const Route = createFileRoute("/docs/$product/$group/")({
  component: GroupIndexPage,
  beforeLoad: ({ params }) => {
    console.log(
      `[GROUP-INDEX ROUTE] beforeLoad: product=${params.product}, group=${params.group}`
    );
  },
  validateParams: ({ product, group }) => {
    console.log(
      `[GROUP-INDEX ROUTE] Validating group index route: product=${product}, group=${group}`
    );

    // Import metadata for validation
    const docsMetadata = require("@/docs/_meta").default;
    const productData = docsMetadata[product];
    
    // If product doesn't exist, don't match this route
    if (!productData) {
      console.error(`[GROUP-INDEX ROUTE] Product not found: ${product}`);
      return false;
    }
    
    // Check if this is actually a section, not a group
    if (productData.sections && productData.sections[group]) {
      console.error(`[GROUP-INDEX ROUTE] "${group}" is a section, not a group. Rejecting match.`);
      return false;
    }
    
    // Verify the group exists in the metadata
    const groupData = productData.groups?.[group];
    if (!groupData) {
      console.error(`[GROUP-INDEX ROUTE] Group not found: ${group} in product ${product}`);
      return false;
    }
    
    console.log(`[GROUP-INDEX ROUTE] Successfully validated path: ${product}/${group}/`);
    return { product, group };
  },
});

function GroupIndexPage() {
  const { product, group } = useParams({
    from: "/docs/$product/$group/",
  });

  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState<{
    meta: DocMeta;
    content: string;
  } | null>(null);
  const [groupDocs, setGroupDocs] = useState<DocMeta[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      console.log(
        `[Group-Index Effect] Loading content for ${product}/${group}/`
      );

      try {
        // Load docs for the sidebar
        const docsInGroup = getDocsForGroup(product, group);
        setGroupDocs(docsInGroup);
        console.log(`[Group-Index] Loaded ${docsInGroup.length} docs for group ${group}`);

        try {
          // First attempt to load the explicit index.mdx file
          const doc = await getDoc(product, { group, slug: "index" });
          console.log(`[Group-Index] Successfully loaded index.mdx for ${group}`);
          setDocument(doc);
        } catch (indexErr) {
          console.warn(
            `[Group-Index] No index.mdx found for ${group}, creating placeholder`
          );
          
          // Create a placeholder with metadata from the group
          const productData = docsMetadata[product];
          const groupData = productData?.groups?.[group];
          
          if (!groupData) {
            throw new Error(`Group ${group} not found in product ${product}`);
          }
          
          // Generate metadata for the index page
          const meta: DocMeta = {
            title: groupData.title,
            description: groupData.description || `${groupData.title} documentation`,
            slug: "index",
            path: `${product}/${group}`,
            product,
            type: "group-item" as DocType,
            group,
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
  .map(([itemSlug, item]) => `- [${item.title}](/docs/${product}/${group}/${itemSlug})`)
  .join("\n")}
`;
          
          setDocument({ meta, content });
        }

        setLoading(false);
      } catch (err) {
        console.error(`[Group-Index] Error loading document:`, err);
        setError(`Failed to load document: ${err.message}`);
        setLoading(false);
      }
    };

    fetchData();
  }, [product, group]);

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
                section={null}
                currentSlug="index"
                docs={groupDocs}
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
              {error || `The index page for ${group} doesn't exist.`}
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
              currentSlug="index"
              docs={groupDocs}
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
                slug="index"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}