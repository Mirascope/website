import { Button } from "@/src/components/ui/button";
import { ButtonLink } from "@/src/components/ui/button-link";
import {
  LLMDocument,
  type IncludedDocument as IncludedDocumentType,
} from "@/src/lib/content/llm-documents";
import { BASE_URL } from "@/src/lib/constants/site";
import { formatTokenCount, tokenBadge } from "./utils";

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

interface MainContentProps {
  document: LLMDocument;
  txtPath: string;
}

export default function MainContent({ document, txtPath }: MainContentProps) {
  const content = document.toString();

  // Transform absolute URLs to relative for in-site navigation
  const toRelativeUrl = (url: string) => {
    return url.startsWith(BASE_URL) ? url.replace(BASE_URL, "") : url;
  };

  return (
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
                This page contains concatenated documentation content, intended for easy consumption
                by Large Language Models. You can copy it using the buttons, or navigate to the raw
                document at{" "}
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
          {/* Header section */}
          {(() => {
            const headerSection = document.sections.find((s) => s.type === "header");
            return headerSection ? (
              <div
                key={headerSection.id}
                id={headerSection.id}
                className="mb-8"
                style={{ scrollMarginTop: "var(--header-height)" }}
              >
                <SectionHeader section={headerSection} url={toRelativeUrl(headerSection.url)} />
                <pre className="text-foreground overflow-auto font-mono text-sm whitespace-pre-wrap">
                  {headerSection.content}
                </pre>
              </div>
            ) : null;
          })()}

          {/* Content sections with documents */}
          {document.contentSections &&
            document.sectionMap &&
            document.contentSections.map((contentSection) => {
              const sectionDocs = document.sectionMap!.get(contentSection.title) || [];
              const sectionId = `content-section-${contentSection.title.toLowerCase().replace(/\s+/g, "-")}`;

              return (
                <div key={sectionId} className="mb-8">
                  {/* Content section header */}
                  <div
                    id={sectionId}
                    className="border-border mb-6 border-t pt-6"
                    style={{ scrollMarginTop: "var(--header-height)" }}
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <h2 className="px-2 text-2xl font-bold">{contentSection.title}</h2>
                      {contentSection.description && (
                        <span className="text-muted-foreground text-sm">
                          {contentSection.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Documents in this section */}
                  {sectionDocs.map((doc) => (
                    <div
                      key={doc.id}
                      id={doc.id}
                      className="mb-6"
                      style={{ scrollMarginTop: "var(--header-height)" }}
                    >
                      <SectionHeader section={doc} url={toRelativeUrl(doc.url)} />
                      <pre className="text-foreground overflow-auto font-mono text-sm whitespace-pre-wrap">
                        {doc.content}
                      </pre>
                    </div>
                  ))}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
