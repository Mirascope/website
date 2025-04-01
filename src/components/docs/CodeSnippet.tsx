import { ReactNode } from "react";
import { useProvider } from "./ProviderContext";

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
  highlightLines,
  className = "",
}: CodeSnippetProps) {
  const { provider, providerInfo } = useProvider();
  
  // Get source content
  let content = typeof children === 'string' ? children : code || '';
  
  // Clean up content if it's a string
  if (typeof content === 'string') {
    // Trim common whitespace (dedent)
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    if (nonEmptyLines.length > 0) {
      const minIndent = Math.min(
        ...nonEmptyLines.map(line => line.match(/^\s*/)?.[0].length || 0)
      );
      
      content = lines
        .map(line => line.slice(minIndent))
        .join('\n')
        .trim();
    }
  }
  
  // Replace template variables without complex parsing
  const processedContent = String(content)
    .replace(/\$PROVIDER_NAME/g, provider.toLowerCase())
    .replace(/\$PROVIDER_PACKAGE/g, providerInfo.packageName)
    .replace(/\$PROVIDER_MODEL/g, providerInfo.defaultModel);
  
  return (
    <div className={`my-4 ${className}`}>
      <pre className="relative rounded-lg bg-gray-100 dark:bg-gray-800 p-4 overflow-x-auto">
        <code className={`language-${language}`}>{processedContent}</code>
      </pre>
    </div>
  );
}