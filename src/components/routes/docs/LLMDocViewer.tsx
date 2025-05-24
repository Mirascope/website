import { Button } from "@/src/components/ui/button";
import { ButtonLink } from "@/src/components/ui/button-link";
import { LLMDocument } from "@/src/lib/content/llm-documents";
import ContentSection from "./ContentSection";

interface LLMDocViewerProps {
  document: LLMDocument;
  txtPath: string;
}

export default function LLMDocViewer({ document, txtPath }: LLMDocViewerProps) {
  const content = document.toString();

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
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

        {/* All sections */}
        <div className="space-y-6">
          {document.sections.map((section) => (
            <ContentSection
              key={section.id}
              title={section.title}
              description={section.description}
              url={section.url}
              content={section.content}
              tokenCount={section.tokenCount}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
