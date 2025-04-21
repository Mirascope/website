import React from "react";
import LoadingContent from "./LoadingContent";
import { MDXRenderer } from "@/src/components/MDXRenderer";
import { type DocContent } from "@/src/lib/content/docs";

interface MainContentProps {
  document: DocContent;
  funMode: boolean;
}

/**
 * MainContent - Main document content area
 *
 * Displays the document title, description, and rendered MDX content
 */
const MainContent: React.FC<MainContentProps> = ({ document, funMode }) => {
  return (
    <div className="flex-1 min-w-0 px-4 lg:px-8">
      <div className="w-full max-w-5xl mx-auto">
        <div
          id="doc-content"
          className="prose prose-sm lg:prose-base prose-slate max-w-none overflow-x-auto mdx-container"
        >
          {document.mdx ? (
            <MDXRenderer
              code={document.mdx.code}
              frontmatter={document.mdx.frontmatter}
              useFunMode={funMode}
            />
          ) : (
            <LoadingContent spinnerClassName="h-8 w-8" fullHeight={false} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MainContent;
