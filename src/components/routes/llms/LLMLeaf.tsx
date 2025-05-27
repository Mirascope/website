import { useState } from "react";
import { LLMContent } from "@/src/lib/content/llm-content";
import { ChevronDown, ChevronRight } from "lucide-react";
import ContentActions from "./ContentActions";

interface LLMLeafProps {
  content: LLMContent;
}

export default function LLMLeaf({ content }: LLMLeafProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sectionId = `section-${content.slug}`;

  return (
    <div id={sectionId} className="mb-6" style={{ scrollMarginTop: "var(--header-height)" }}>
      <div className="border-border mb-4 flex items-start justify-between border-b pb-2">
        <div className="flex-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <h3 className="text-foreground rounded-md px-2 py-1 text-base font-bold">
              {content.title}
            </h3>
          </button>
          {content.description && (
            <p className="text-muted-foreground mt-1 ml-5 px-2 text-sm">{content.description}</p>
          )}
        </div>
        <ContentActions item={content} />
      </div>

      {isExpanded && (
        <pre className="text-foreground overflow-auto font-mono text-sm whitespace-pre-wrap">
          {content.getContent()}
        </pre>
      )}
    </div>
  );
}
