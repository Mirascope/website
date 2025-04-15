import { createFileRoute } from "@tanstack/react-router";
import DevLayout from "@/components/dev/DevLayout";
import { MDXRenderer } from "@/components/MDXRenderer";
import { useState, useEffect } from "react";
import { processMDX } from "@/lib/content/mdx-processor";

export const Route = createFileRoute("/dev/style-test")({
  component: StyleTestPage,
});

// Flag to determine if we're in development mode
const isDev = import.meta.env.DEV;

function StyleTestPage() {
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

        let code: string;
        let frontmatter: Record<string, any>;

        if (isDev) {
          // In development, fetch the MDX file directly
          const response = await fetch("/src/components/dev/style-test.mdx");

          if (!response.ok) {
            throw new Error(`Failed to load content in dev: ${response.statusText}`);
          }

          const rawContent = await response.text();

          // Process MDX content (using existing processor)
          const processed = await processMDX(rawContent);
          code = processed.code;
          frontmatter = processed.frontmatter;
        } else {
          // In production, fetch the preprocessed JSON file
          const response = await fetch("/static/dev/style-test.mdx.json");

          if (!response.ok) {
            throw new Error(`Failed to load content in prod: ${response.statusText}`);
          }

          const data = await response.json();

          // Process MDX content from the JSON
          const processed = await processMDX(data.content);
          code = processed.code;
          frontmatter = processed.frontmatter;
        }

        setMdxContent({ code, frontmatter });
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
        {isLoading && (
          <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-40 rounded-md"></div>
        )}

        {error && (
          <div className="p-4 border border-red-500 rounded-md bg-red-50 text-red-800">
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
