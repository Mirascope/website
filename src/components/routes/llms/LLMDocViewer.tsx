import { Button } from "@/src/components/ui/button";
import { ButtonLink } from "@/src/components/ui/button-link";
import {
  LLMDocument,
  type IncludedDocument as IncludedDocumentType,
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
  return `${rounded}k`;
};

const tokenBadge =
  "bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs font-medium";

// Inline SectionHeader component
interface SectionHeaderProps {
  section: IncludedDocumentType;
  url: string;
}

function SectionHeader({ section, url }: SectionHeaderProps) {
  const handleCopySection = () => {
    navigator.clipboard.writeText(section.content);
  };

  return (
    <div className="border-border mb-4 flex items-center justify-between border-b pb-2">
      <div className="flex items-center gap-3">
        <h2 className="text-foreground rounded-md px-2 py-1 text-base font-bold">
          {section.title}
        </h2>
      </div>
      <div className="flex items-center gap-2">
        <span className={tokenBadge}>{formatTokenCount(section.tokenCount)} tokens</span>
        <Button onClick={handleCopySection} variant="ghost" size="sm" className="text-xs">
          Copy
        </Button>
        <ButtonLink href={url} variant="ghost" size="sm" className="text-xs">
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
      content: (
        <div className="flex items-center gap-2">
          <div className="flex w-10 justify-end">
            <span className={tokenBadge}>{formatTokenCount(section.tokenCount)}</span>
          </div>
          <span>{section.title}</span>
        </div>
      ),
      level: 1, // All sections at the same level for now
    })),
  ];

  return (
    <AppLayout>
      <AppLayout.Content>
        <div className="bg-background container mx-auto min-h-screen px-4 py-4">
          {/* Single continuous document view with integrated header */}
          <div className="bg-card/20 border-border relative overflow-hidden rounded-lg border">
            {/* Document header - integrated into the card */}
            <div className="bg-primary/10 border-border border-b p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1
                    className="mb-2 text-2xl font-bold"
                    id="top"
                    style={{ scrollMarginTop: "var(--header-height)" }}
                  >
                    {document.metadata.title}
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    This page contains concatenated documentation content, intended for easy
                    consumption by Large Language Models. You can copy it using the buttons, or
                    navigate to the raw document at{" "}
                    <a href={txtPath} className="text-primary underline">
                      {txtPath}
                    </a>
                    .
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <span className={tokenBadge}>
                    {formatTokenCount(document.metadata.totalTokens)} tokens
                  </span>
                  <Button
                    onClick={() => navigator.clipboard.writeText(content)}
                    variant="outline"
                    size="sm"
                  >
                    Copy
                  </Button>
                  <ButtonLink href={txtPath} external variant="outline" size="sm">
                    Raw
                  </ButtonLink>
                </div>
              </div>
            </div>

            {/* Document content */}
            <div className="p-6">
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
