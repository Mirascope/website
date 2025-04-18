// No need to import React with JSX transform
import { useProvider } from "./docs/ProviderContext";
import { CodeBlock } from "./CodeBlock";
import { replaceProviderVariables } from "@/config/providers";

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
  const { provider } = useProvider();

  // Only process python or bash code
  if (code && (language === "python" || language === "bash")) {
    code = replaceProviderVariables(code, provider);
  }

  return <CodeBlock code={code} language={language} meta={meta} />;
}
