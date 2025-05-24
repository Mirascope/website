import { Button } from "@/src/components/ui/button";
import { ButtonLink } from "@/src/components/ui/button-link";
import {
  LLMDocument,
  type ContentSection as ContentSectionType,
} from "@/src/lib/content/llm-documents";
import { BASE_URL } from "@/src/lib/constants/site";

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
        <h2 className="text-lg font-semibold">{section.title}</h2>
      </div>
      <div className="flex items-center gap-2">
        <span className="bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs font-medium">
          {section.tokenCount.toLocaleString()} tokens
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

  return (
    <div className="bg-background container mx-auto min-h-screen px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-4 text-3xl font-bold">LLM Document Viewer</h1>

        <div className="mb-6 flex gap-4">
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
          Total Tokens: {document.metadata.totalTokens.toLocaleString()}
        </div>
      </div>

      {/* Single continuous document view */}
      <div className="bg-card/20 border-border relative rounded-lg border p-6">
        {document.sections.map((section) => (
          <div key={section.id} className="mb-6">
            <SectionHeader section={section} url={toRelativeUrl(section.url)} />
            <pre className="text-foreground overflow-auto font-mono text-sm whitespace-pre-wrap">
              {section.content}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
