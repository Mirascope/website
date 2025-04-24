import { createFileRoute } from "@tanstack/react-router";
import { LoadingContent } from "@/src/components/docs";
import DevLayout from "@/src/components/dev/DevLayout";
import { MDXRenderer } from "@/src/components/MDXRenderer";
import { useState, useEffect } from "react";
import { processMDXContent } from "@/src/lib/content";
import { environment } from "@/src/lib/content/environment";

export const Route = createFileRoute("/dev/code-highlight-test")({
  component: CodeHighlightTest,
  onError: (error: Error) => environment.onError(error),
});

function CodeHighlightTest() {
  const [mdxContent, setMdxContent] = useState<{
    code: string;
    frontmatter: Record<string, any>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadMdxContent() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/static/content/dev/code-highlight-test.json");

        if (!response.ok) {
          throw new Error(`Failed to load content: ${response.statusText}`);
        }

        const data = await response.json();

        // Process MDX content from the JSON
        const processed = await processMDXContent(data.content, "dev", {
          path: "/static/content/dev/code-highlight-test.json",
        });

        setMdxContent({
          code: processed.code,
          frontmatter: processed.frontmatter,
        });
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading MDX content:", err);
        setError(err instanceof Error ? err : new Error("Failed to load content"));
        setIsLoading(false);
      }
    }

    loadMdxContent();
  }, []);

  return (
    <DevLayout>
      <div className="container py-8">
        {isLoading && <LoadingContent spinnerClassName="h-12 w-12" fullHeight={false} />}

        {error && (
          <div className="p-4 border border-border rounded-md bg-muted text-foreground">
            <h3 className="font-bold mb-2">Error loading content</h3>
            <p>{error.message}</p>
          </div>
        )}

        {mdxContent && (
          <div className="prose dark:prose-invert max-w-none">
            <MDXRenderer code={mdxContent.code} frontmatter={mdxContent.frontmatter} />
          </div>
        )}
      </div>
    </DevLayout>
  );
}
