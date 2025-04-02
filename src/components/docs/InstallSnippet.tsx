import { useState } from "react";
import { useProvider } from "./ProviderContext";
import type { Provider } from "./ProviderContext";
import { CodeSnippet } from "./CodeSnippet";

// Define available operating systems
export type OS = "MacOS / Linux" | "Windows";
export const operatingSystems: OS[] = ["MacOS / Linux", "Windows"];

// Define API key variables for each provider
const providerApiKeys: Record<Provider, string | null> = {
  "OpenAI": "OPENAI_API_KEY",
  "Anthropic": "ANTHROPIC_API_KEY",
  "Mistral": "MISTRAL_API_KEY",
  "Google": "GOOGLE_API_KEY",
  "Groq": "GROQ_API_KEY",
  "Cohere": "CO_API_KEY",
  "LiteLLM": "OPENAI_API_KEY", // LiteLLM uses OpenAI's API key by default
  "Azure AI": "AZURE_API_KEY",
  "Bedrock": null, // Superceded by custom instruction
  "xAI": "XAI_API_KEY",
};

// Special cases for providers like Bedrock, Azure, etc.
const specialInstallInstructions: Record<string, Record<OS, string>> = {
  "Bedrock": {
    "MacOS / Linux": "aws configure",
    "Windows": "aws configure"
  },
  "Azure AI": {
    "MacOS / Linux": "export AZURE_INFERENCE_ENDPOINT=XXXX\nexport AZURE_INFERENCE_CREDENTIAL=XXXX",
    "Windows": "set AZURE_INFERENCE_ENDPOINT=XXXX\nset AZURE_INFERENCE_CREDENTIAL=XXXX"
  }
};

interface InstallSnippetProps {
  className?: string;
  showSelector?: boolean;
}

export function InstallSnippet({ 
  className = "",
  showSelector = true
}: InstallSnippetProps) {
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
  
  // OS selector component
  const OSSelector = () => {
    if (!showSelector) return null;
    
    return (
      <div className="my-4">
        <h4 className="text-sm font-medium mb-2">Select Operating System:</h4>
        <div className="flex gap-2">
          {operatingSystems.map((currentOS) => (
            <button
              key={currentOS}
              onClick={() => setOS(currentOS)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                os === currentOS
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              }`}
            >
              {currentOS}
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className={className}>
      <OSSelector />
      <CodeSnippet
        code={installCommand}
        language="bash"
      />
    </div>
  );
}