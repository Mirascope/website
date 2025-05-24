import { Button } from "@/src/components/ui/button";
import { ButtonLink } from "@/src/components/ui/button-link";
import {
  LLMDocument,
  type ContentSection as ContentSectionType,
} from "@/src/lib/content/llm-documents";
import { BASE_URL } from "@/src/lib/constants/site";
import AppLayout from "@/src/components/core/layout/AppLayout";
import { TableOfContents, type TOCItem } from "@/src/components/core/navigation/TableOfContents";

// Format token count with approximation (OpenAI tokenizer)
const formatTokenCount = (count: number): string => {
  if (count < 1000) {
    return "<1k";
  }
  const rounded = Math.round(count / 1000);
  return `~${rounded}k`;
};

// Inline SectionHeader component
interface SectionHeaderProps {
  section: ContentSectionType;
  url: string;
}

function SectionHeader({ section, url }: SectionHeaderProps) {
  const handleCopySection = () => {
    navigator.clipboard.writeText(section.content);
  };

  return (
    <div className="bg-card/95 border-border sticky top-4 z-10 mb-2 flex items-center justify-between rounded-lg border p-3 shadow-sm backdrop-blur-sm">
      <div className="flex-1">
        <h2 className="font-sans text-lg font-semibold">{section.title}</h2>
      </div>
      <div className="flex items-center gap-2">
        <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs font-medium">
          {formatTokenCount(section.tokenCount)} tokens
        </span>
        <Button onClick={handleCopySection} variant="outline" size="sm">
          Copy
        </Button>
        <ButtonLink href={url} variant="default" size="sm">
          Docs
        </ButtonLink>
      </div>
    </div>
  );
}

interface LLMDocViewerProps {
  document: LLMDocument;
  txtPath: string;
}

export default function LLMDocViewer({ document, txtPath }: LLMDocViewerProps) {
  const content = document.toString();

  // Transform absolute URLs to relative for in-site navigation
  const toRelativeUrl = (url: string) => {
    return url.startsWith(BASE_URL) ? url.replace(BASE_URL, "") : url;
  };

  // Convert content sections to TOC items (including header)
  const tocItems: TOCItem[] = [
    ...document.sections.map((section) => ({
      id: section.id,
      content: section.title,
      level: 1, // All sections at the same level for now
    })),
  ];

  return (
    <AppLayout>
      <AppLayout.Content>
        <div className="bg-background container mx-auto min-h-screen px-4 py-8">
          <div className="mb-8">
            <h1
              className="mb-4 text-3xl font-bold"
              id="top"
              style={{ scrollMarginTop: "var(--header-height)" }}
            >
              {document.metadata.title}
            </h1>
            <p>
              This page contains concatenated documentation content, intended for easy consumption
              by Large Language Models. You can use the copy it using the buttons below, or navigate
              to the raw document directly at{" "}
              <a href={txtPath} className="text-primary underline">
                {txtPath}
              </a>
              .
            </p>

            <div className="my-6 flex gap-4">
              <Button onClick={() => navigator.clipboard.writeText(content)} variant="default">
                Copy Content
              </Button>

              <ButtonLink href={txtPath} external variant="outline" download>
                Download .txt
              </ButtonLink>

              <ButtonLink href={txtPath} external variant="outline">
                View Raw
              </ButtonLink>
            </div>

            <div className="text-muted-foreground mb-4 text-sm">
              Total Tokens: {formatTokenCount(document.metadata.totalTokens)} tokens
            </div>
          </div>

          {/* Single continuous document view */}
          <div className="bg-card/20 border-border relative rounded-lg border p-6">
            {document.sections.map((section) => (
              <div
                key={section.id}
                id={section.id}
                className="mb-6"
                style={{ scrollMarginTop: "var(--header-height)" }}
              >
                <SectionHeader section={section} url={toRelativeUrl(section.url)} />
                <pre className="text-foreground overflow-auto font-mono text-sm whitespace-pre-wrap">
                  {section.content}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </AppLayout.Content>

      <AppLayout.RightSidebar mobileCollapsible>
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
      </AppLayout.RightSidebar>
    </AppLayout>
  );
}
