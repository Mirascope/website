import type { ReactNode } from "react";
import { useProvider } from "./ProviderContext";
import { CodeBlock } from "../CodeBlock";

interface CodeSnippetProps {
  code?: string;
  children?: ReactNode;
  language?: string;
  highlightLines?: string;
  className?: string;
}

export function CodeSnippet({
  code,
  children,
  language = "python",
  className = "",
}: CodeSnippetProps) {
  const { provider, providerInfo } = useProvider();

  // Determine which code to use
  let content: string;

  if (code) {
    // Use the code prop if available
    content = code;
  } else if (typeof children === "string") {
    // Use children as string if available
    content = children;
  } else {
    // Fallback
    content = "// No code provided";
  }

  // Clean up content if it's a string
  if (typeof content === "string") {
    // Trim common whitespace (dedent)
    const lines = content.split("\n");
    const nonEmptyLines = lines.filter((line) => line.trim().length > 0);

    if (nonEmptyLines.length > 0) {
      const minIndent = Math.min(
        ...nonEmptyLines.map((line) => line.match(/^\s*/)?.[0].length || 0)
      );

      content = lines
        .map((line) => line.slice(minIndent))
        .join("\n")
        .trim();
    }
  }

  // Replace template variables
  const processedContent = String(content)
    .replace(/\$PROVIDER/g, provider)
    .replace(/\$MODEL/g, providerInfo.defaultModel);

  return (
    <div className={`my-4 ${className}`}>
      <CodeBlock code={processedContent} language={language} />
    </div>
  );
}
