import { useState } from "react";
import { useProvider } from "./ProviderContext";
import type { Provider } from "./ProviderContext";
import { CodeBlock } from "../CodeBlock";
import { cn } from "@/lib/utils";

// Define available operating systems
export type OS = "MacOS / Linux" | "Windows";
export const operatingSystems: OS[] = ["MacOS / Linux", "Windows"];

// Define API key variables for each provider
const providerApiKeys: Record<Provider, string | null> = {
  OpenAI: "OPENAI_API_KEY",
  Anthropic: "ANTHROPIC_API_KEY",
  Mistral: "MISTRAL_API_KEY",
  Google: "GOOGLE_API_KEY",
  Groq: "GROQ_API_KEY",
  Cohere: "CO_API_KEY",
  LiteLLM: "OPENAI_API_KEY", // LiteLLM uses OpenAI's API key by default
  "Azure AI": "AZURE_API_KEY",
  Bedrock: null, // Superceded by custom instruction
  xAI: "XAI_API_KEY",
};

// Special cases for providers like Bedrock, Azure, etc.
const specialInstallInstructions: Record<string, Record<OS, string>> = {
  Bedrock: {
    "MacOS / Linux": "aws configure",
    Windows: "aws configure",
  },
  "Azure AI": {
    "MacOS / Linux": "export AZURE_INFERENCE_ENDPOINT=XXXX\nexport AZURE_INFERENCE_CREDENTIAL=XXXX",
    Windows: "set AZURE_INFERENCE_ENDPOINT=XXXX\nset AZURE_INFERENCE_CREDENTIAL=XXXX",
  },
};

interface InstallSnippetProps {
  className?: string;
  showSelector?: boolean;
}

export function InstallSnippet({ className = "", showSelector = true }: InstallSnippetProps) {
  // Local state for OS selection
  const [os, setOS] = useState<OS>("MacOS / Linux");

  const { provider, providerInfo } = useProvider();

  // Get the set environment variable command based on OS
  const setEnvCmd = os === "MacOS / Linux" ? "export" : "set";
  const apiKeyVar = providerApiKeys[provider];

  // Check if this provider has special install instructions
  const hasSpecialInstructions = provider in specialInstallInstructions;
  const specialInstructions = hasSpecialInstructions
    ? specialInstallInstructions[provider][os]
    : `${setEnvCmd} ${apiKeyVar}=XXXX`;

  // Installation command
  const installCommand = `pip install "mirascope[${providerInfo.packageName}]"\n${specialInstructions}`;

  return (
    <div className={cn("rounded-md border-2 border-blue-600/50 bg-[#191c20] shadow-md overflow-hidden", className)}>
      <div className="flex border-b border-gray-700 px-3">
        {operatingSystems.map((currentOS) => (
          <button
            key={currentOS}
            onClick={() => setOS(currentOS)}
            className={cn(
              "px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200 relative",
              (os === currentOS) && "text-white border-b-2 border-white"
            )}
          >
            {currentOS}
          </button>
        ))}
      </div>
      
      <div className="p-0 m-0">
        <CodeBlock 
          code={installCommand} 
          language="bash" 
          className="border-0 bg-transparent m-0 p-0" 
        />
      </div>
    </div>
  );
}
