import { useState } from "react";
import { ButtonLink } from "@/src/components/ui/button-link";
import { LLMContent } from "@/src/lib/content/llm-content";
import { ChevronDown, ChevronRight, Binary } from "lucide-react";
import ContentActions from "./ContentActions";

interface ContentItemProps {
  content: LLMContent;
  level?: number;
}

function ContentItem({ content, level = 1 }: ContentItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isContainer = content.isContainer();
  const sectionId = `section-${content.slug}`;

  if (isContainer) {
    // This is a container with children
    return (
      <div key={sectionId}>
        <div
          id={sectionId}
          className="border-border mb-6 border-b pt-2"
          style={{ scrollMarginTop: "var(--header-height)" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className={`px-2 font-bold ${level === 1 ? "text-2xl" : "text-xl"}`}>
                {content.title}
              </h2>
              {content.description && (
                <span className="text-muted-foreground text-sm">{content.description}</span>
              )}
            </div>
            <ContentActions item={content} />
          </div>
        </div>

        {/* Render children */}
        {content.getChildren().map((child) => (
          <ContentItem key={child.slug} content={child} level={level + 1} />
        ))}
      </div>
    );
  } else {
    // This is a leaf content item
    return (
      <div id={sectionId} className="mb-6" style={{ scrollMarginTop: "var(--header-height)" }}>
        <div className="border-border mb-4 flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-3">
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
}

interface DocumentHeaderProps {
  document: LLMContent;
  txtPath: string;
}

function DocumentHeader({ document, txtPath }: DocumentHeaderProps) {
  return (
    <div className="bg-primary/10 border-border border-b p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1
            className="mb-2 text-2xl font-bold"
            id="top"
            style={{ scrollMarginTop: "var(--header-height)" }}
          >
            {document.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            Concatenated markdown docs, intended for use by LLMs. Copy it using the buttons, or
            navigate to{" "}
            <a href={txtPath} className="text-primary underline">
              {txtPath}
            </a>
            .
          </p>
        </div>
        <div className="ml-4 flex items-center gap-2">
          <ContentActions item={document} variant="ghost" showDocs={false} />
          <ButtonLink href={txtPath} external variant="ghost" size="sm">
            <Binary className="mr-1 h-4 w-4" />
            Raw
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

interface MainContentProps {
  document: LLMContent;
  txtPath: string;
}

export default function MainContent({ document, txtPath }: MainContentProps) {
  return (
    <div className="bg-background container mx-auto min-h-screen px-4">
      {/* Single continuous document view with integrated header */}
      <div className="bg-card/20 border-border relative overflow-hidden rounded-lg border">
        {/* Document header - integrated into the card */}
        <DocumentHeader document={document} txtPath={txtPath} />

        {/* Document content */}
        <div className="p-6">
          {/* Render content items */}
          {document.getChildren().map((item) => (
            <ContentItem key={item.slug} content={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
