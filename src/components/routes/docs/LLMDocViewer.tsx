import { countTokens, formatTokenCount } from "@/src/lib/token-counter";
import { Button } from "@/src/components/ui/button";
import { ButtonLink } from "@/src/components/ui/button-link";

interface LLMDocViewerProps {
  content: string;
  txtPath: string;
}

export default function LLMDocViewer({ content, txtPath }: LLMDocViewerProps) {
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
            Tokens: {formatTokenCount(countTokens(content))}
          </div>
        </div>

        <div className="bg-card border-border rounded-lg border p-6">
          <pre className="text-foreground overflow-auto font-mono text-sm whitespace-pre-wrap">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
}
