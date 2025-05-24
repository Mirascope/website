import { ButtonLink } from "@/src/components/ui/button-link";
import { Button } from "@/src/components/ui/button";

interface ContentSectionProps {
  title: string;
  description?: string;
  url: string;
  content: string;
  tokenCount: number;
}

export default function ContentSection({
  title,
  description,
  url,
  content,
  tokenCount,
}: ContentSectionProps) {
  const handleCopySection = () => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="border-border mb-8 border-b pb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-medium">
            {tokenCount.toLocaleString()} tokens
          </span>
          <Button onClick={handleCopySection} variant="outline" size="sm">
            Copy Section
          </Button>
          <ButtonLink href={url} variant="ghost" size="sm">
            View Docs
          </ButtonLink>
        </div>
      </div>
      <div className="bg-card border-border rounded-lg border p-4">
        <pre className="text-foreground overflow-auto font-mono text-sm whitespace-pre-wrap">
          {content}
        </pre>
      </div>
    </div>
  );
}
