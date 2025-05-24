import { TableOfContents, type TOCItem } from "@/src/components";
import { LLMDocument } from "@/src/lib/content/llm-documents";
import { formatTokenCount, tokenBadge } from "./utils";

interface TocSidebarProps {
  document: LLMDocument;
}

export default function TocSidebar({ document }: TocSidebarProps) {
  // Convert to hierarchical TOC items
  const tocItems: TOCItem[] = [];

  // Process content items
  for (const item of document.children) {
    if ("content" in item) {
      // IncludedDocument (e.g., Table of Contents)
      tocItems.push({
        id: item.id,
        content: (
          <div className="flex items-center gap-2">
            <div className="flex w-10 justify-end">
              <span className={tokenBadge}>{formatTokenCount(item.tokenCount)}</span>
            </div>
            <span className="font-medium">{item.title}</span>
          </div>
        ),
        level: 1,
      });
    } else {
      // ContentContainer
      tocItems.push({
        id: `content-section-${item.title.toLowerCase().replace(/\s+/g, "-")}`,
        content: (
          <div className="flex items-center gap-2">
            <div className="flex w-10 justify-end">
              <span className={tokenBadge}>{formatTokenCount(item.tokenCount)}</span>
            </div>
            <span className="font-medium">{item.title}</span>
          </div>
        ),
        level: 1,
      });

      // Add documents under this section
      for (const doc of item.children) {
        if ("content" in doc && "id" in doc) {
          tocItems.push({
            id: (doc as any).id,
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
