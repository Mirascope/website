import { useProvider } from "./ProviderContext";
import { CodeBlock } from "../CodeBlock";

interface ProviderTestSnippetProps {
  source: string;
  language?: string;
  className?: string;
}

/**
 * A component for testing provider-specific code snippets
 * Takes a string prop instead of children to avoid MDX parsing issues
 */
export function ProviderTestSnippet({
  source,
  language = "python",
  className = "",
}: ProviderTestSnippetProps) {
  const { provider, providerInfo } = useProvider();

  // Replace template variables
  const processedContent = source
    .replace(/\$PROVIDER_PACKAGE/g, providerInfo.packageName)
    .replace(/\$PROVIDER_MODEL/g, providerInfo.defaultModel);

  return (
    <div className={`my-4 ${className}`}>
      <p className="text-sm text-gray-500 mb-2">
        Provider: {provider} | Package: {providerInfo.packageName} | Model:{" "}
        {providerInfo.defaultModel}
      </p>
      <CodeBlock code={processedContent} language={language} />
    </div>
  );
}
