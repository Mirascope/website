import React, { ReactNode } from "react";
import { useProvider } from "./ProviderContext";
import type { Provider } from "./ProviderContext";

interface CodeSnippetProps {
  children: ReactNode;
  language?: string;
  highlightLines?: string;
  className?: string;
}

export function CodeSnippet({
  children,
  language = "python",
  highlightLines,
  className = "",
}: CodeSnippetProps) {
  const { provider, providerInfo } = useProvider();
  
  // Get the code as a string
  let code = children?.toString() || "";
  
  // Replace placeholders with provider-specific values
  code = code
    .replace(/\$PROVIDER_NAME/g, provider.toLowerCase())
    .replace(/\$PROVIDER_PACKAGE/g, providerInfo.packageName)
    .replace(/\$PROVIDER_MODEL/g, providerInfo.defaultModel);
  
  // Prepare the highlight attribute
  const highlightAttr = highlightLines ? ` {${highlightLines}}` : "";

  return (
    <div className={`my-4 ${className}`}>
      <pre>
        <code className={`language-${language}${highlightAttr}`}>
          {code}
        </code>
      </pre>
    </div>
  );
}