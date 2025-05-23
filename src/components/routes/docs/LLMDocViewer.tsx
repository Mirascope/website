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
            <button
              onClick={() => navigator.clipboard.writeText(content)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded px-4 py-2"
            >
              Copy Content
            </button>

            <a
              href={txtPath}
              download
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded px-4 py-2"
            >
              Download .txt
            </a>

            <a
              href={txtPath}
              target="_blank"
              rel="noopener noreferrer"
              className="border-border hover:bg-muted rounded border px-4 py-2"
            >
              View Raw
            </a>
          </div>

          <div className="text-muted-foreground mb-4 text-sm">
            Approximate tokens: {Math.ceil(content.length / 4).toLocaleString()}
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
