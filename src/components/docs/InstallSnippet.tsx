import { useState } from "react";
import { useProvider } from "./ProviderContext";
import type { Provider } from "./ProviderContext";
import { CodeBlock } from "../CodeBlock";
import { cn } from "@/src/lib/utils";

// Define available operating systems
export type OS = "MacOS / Linux" | "Windows";
export const operatingSystems: OS[] = ["MacOS / Linux", "Windows"];

// Define API key variables for each provider
const providerApiKeys: Record<Provider, string | null> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  mistral: "MISTRAL_API_KEY",
  google: "GOOGLE_API_KEY",
  groq: "GROQ_API_KEY",
  cohere: "CO_API_KEY",
  litellm: "OPENAI_API_KEY", // LiteLLM uses OpenAI's API key by default
  azure: "AZURE_API_KEY",
  bedrock: null, // Superceded by custom instruction
  xai: "XAI_API_KEY",
};

// Special cases for providers like Bedrock, Azure, etc.
const specialInstallInstructions: Record<string, Record<OS, string>> = {
  bedrock: {
    "MacOS / Linux": "aws configure",
    Windows: "aws configure",
  },
  azure: {
    "MacOS / Linux": "export AZURE_INFERENCE_ENDPOINT=XXXX\nexport AZURE_INFERENCE_CREDENTIAL=XXXX",
    Windows: "set AZURE_INFERENCE_ENDPOINT=XXXX\nset AZURE_INFERENCE_CREDENTIAL=XXXX",
  },
};

interface InstallSnippetProps {
  className?: string;
}

export function InstallSnippet({ className = "" }: InstallSnippetProps) {
  // Local state for OS selection
  const [os, setOS] = useState<OS>("MacOS / Linux");

  const { provider } = useProvider();

  // Get the set environment variable command based on OS
  const setEnvCmd = os === "MacOS / Linux" ? "export" : "set";
  const apiKeyVar = providerApiKeys[provider];

  // Check if this provider has special install instructions
  const hasSpecialInstructions = provider in specialInstallInstructions;
  const specialInstructions = hasSpecialInstructions
    ? specialInstallInstructions[provider][os]
    : `${setEnvCmd} ${apiKeyVar}=XXXX`;

  // Installation command
  const installCommand = `pip install "mirascope[${provider}]"\n${specialInstructions}`;

  return (
    <div className={cn("bg-button-primary overflow-hidden rounded-md shadow-md", className)}>
      <div className="border-border flex border-b px-3">
        {operatingSystems.map((currentOS) => (
          <button
            key={currentOS}
            onClick={() => setOS(currentOS)}
            className={cn(
              "text-muted hover:text-muted-foreground relative px-4 py-1.5 text-sm",
              os === currentOS && "border-b-2 border-white text-white"
            )}
          >
            {currentOS}
          </button>
        ))}
      </div>

      <div className="m-0 p-0">
        <CodeBlock
          code={installCommand}
          language="bash"
          className="m-0 border-0 bg-transparent p-0"
        />
      </div>
    </div>
  );
}
