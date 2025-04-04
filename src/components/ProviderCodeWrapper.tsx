// No need to import React with JSX transform
import { useProvider } from "./docs/ProviderContext";
import { CodeBlock } from "./CodeBlock";

/**
 * A wrapper component for code blocks that handles provider-specific substitutions.
 * This allows us to use standard markdown code blocks with provider-specific variables.
 */
export function ProviderCodeWrapper({
  code,
  language,
  meta,
}: {
  code: string;
  language: string;
  meta?: string;
}) {
  const { provider, providerInfo } = useProvider();

  // Only process python or bash code
  if (code && (language === "python" || language === "bash")) {
    // Check if this code block contains provider variables
    const hasProviderVars =
      code.includes("$PROVIDER_NAME") ||
      code.includes("$PROVIDER_PACKAGE") ||
      code.includes("$PROVIDER_MODEL");

    if (hasProviderVars) {
      // Replace provider variables
      code = code
        .replace(/\$PROVIDER_NAME/g, provider.toLowerCase())
        .replace(/\$PROVIDER_PACKAGE/g, providerInfo.packageName)
        .replace(/\$PROVIDER_MODEL/g, providerInfo.defaultModel);
    }
  }

  return <CodeBlock code={code} language={language} meta={meta} />;
}
