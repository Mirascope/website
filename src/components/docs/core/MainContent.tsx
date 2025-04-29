import React from "react";
import LoadingContent from "./LoadingContent";
import { MDXRenderer } from "@/src/components/MDXRenderer";
import { type DocContent } from "@/src/lib/content";
import PagefindMeta from "@/src/components/PagefindMeta";

interface MainContentProps {
  document: DocContent;
}

/**
 * MainContent - Main document content area
 *
 * Displays the document title, description, and rendered MDX content
 */
const MainContent: React.FC<MainContentProps> = ({ document }) => {
  const path = document.meta.path;
  const pieces = path.split("/");
  const section = pieces.slice(0, 3).join("/");
  return (
    <div className="min-w-0 flex-1 px-4 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div
          id="doc-content"
          className="prose prose-sm lg:prose-base prose-slate mdx-container max-w-none overflow-x-auto"
        >
          {document.mdx ? (
            <PagefindMeta
              title={document.meta.title}
              description={document.meta.description}
              section={section}
              searchWeight={document.meta.searchWeight}
            >
              <MDXRenderer code={document.mdx.code} frontmatter={document.mdx.frontmatter} />
            </PagefindMeta>
          ) : (
            <LoadingContent spinnerClassName="h-8 w-8" fullHeight={false} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MainContent;
