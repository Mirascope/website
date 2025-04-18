import { createFileRoute } from "@tanstack/react-router";
import { LoadingContent } from "@/components/docs";
import DevLayout from "@/components/dev/DevLayout";
import { MDXRenderer } from "@/components/MDXRenderer";
import { useState, useEffect } from "react";
import { processMDXContent } from "@/lib/content/mdx-processor";
import { environment } from "@/lib/content/environment";

export const Route = createFileRoute("/dev/style-test")({
  component: StyleTestPage,
  onError: (error: Error) => environment.onError(error),
});

// Flag to determine if we're in development mode
const isDev = import.meta.env.DEV;

type ColorThemeDisplayProps = {
  bgColors?: string[];
  textColors?: string[];
};

export const ColorThemeDisplay: React.FC<ColorThemeDisplayProps> = ({
  bgColors = ["bg-background", "bg-muted", "bg-primary", "bg-secondary", "bg-accent"],
  textColors = [
    "text-foreground",
    "text-primary",
    "text-secondary",
    "text-accent-foreground",
    "text-muted-foreground",
  ],
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-6">
      {bgColors.map((bgColor) => (
        <div key={bgColor} className={`border rounded-lg shadow-sm ${bgColor}`}>
          <h3 className="px-3 pt-3 text-md font-medium block">{bgColor}</h3>
          <div className="p-3 space-y-2">
            {textColors.map((textColor) => (
              <div
                key={`${bgColor}-${textColor}`}
                className={`w-full h-8 ${textColor} flex items-center justify-center font-sm`}
              >
                {textColor}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

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

          // Process MDX content
          const processed = await processMDXContent(rawContent);
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
          const processed = await processMDXContent(data.content);
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
      <div className="">
        <h2 className="text-2xl font-bold mb-4">Theme Color Combinations</h2>
        <p className="mb-4">
          Comprehensive view of text colors against different background colors
        </p>

        <h3 className="text-xl font-semibold mb-3">Background + Text Colors</h3>
        <ColorThemeDisplay
          bgColors={["bg-background", "bg-muted", "bg-accent"]}
          textColors={[
            "text-foreground",
            "text-primary",
            "text-secondary",
            "text-accent-foreground",
            "text-muted-foreground",
          ]}
        />

        <h3 className="text-xl font-semibold mb-3">Semantic Background + Text Colors</h3>
        <ColorThemeDisplay
          bgColors={["bg-button-primary", "bg-primary", "bg-secondary", "bg-lilypad-green"]}
          textColors={[
            "text-primary-foreground",
            "text-secondary-foreground",
            "text-accent-foreground",
          ]}
        />
      </div>
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
