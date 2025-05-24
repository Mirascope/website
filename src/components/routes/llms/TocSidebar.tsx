import { TableOfContents, type TOCItem } from "@/src/components";
import { LLMDocument } from "@/src/lib/content/llm-documents";
import { formatTokenCount, tokenBadge } from "./utils";

interface TocSidebarProps {
  document: LLMDocument;
}

export default function TocSidebar({ document }: TocSidebarProps) {
  // Convert to hierarchical TOC items
  const tocItems: TOCItem[] = [];

  // Add content sections with their documents
  if (document.contentSections && document.sectionMap) {
    for (const contentSection of document.contentSections) {
      // Add the content section header
      const sectionDocs = document.sectionMap.get(contentSection.title) || [];
      const sectionTokens = sectionDocs.reduce((sum, doc) => sum + doc.tokenCount, 0);

      tocItems.push({
        id: `content-section-${contentSection.title.toLowerCase().replace(/\s+/g, "-")}`,
        content: (
          <div className="flex items-center gap-2">
            <div className="flex w-10 justify-end">
              <span className={tokenBadge}>{formatTokenCount(sectionTokens)}</span>
            </div>
            <span className="font-medium">{contentSection.title}</span>
          </div>
        ),
        level: 1,
      });

      // Add documents under this content section
      for (const doc of sectionDocs) {
        tocItems.push({
          id: doc.id,
          content: (
            <div className="flex items-center gap-2">
              <div className="flex w-10 justify-end">
                <span className={tokenBadge}>{formatTokenCount(doc.tokenCount)}</span>
              </div>
              <span>{doc.title}</span>
            </div>
          ),
          level: 2,
        });
      }
    }
  }

  return (
    <div className="py-6">
      <h3 className="mb-4 text-sm font-semibold">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-muted-foreground hover:text-foreground font-inherit cursor-pointer border-none bg-transparent p-0 transition-colors"
        >
          Table of Contents
        </button>
      </h3>
      <TableOfContents headings={tocItems} observeHeadings />
    </div>
  );
}
