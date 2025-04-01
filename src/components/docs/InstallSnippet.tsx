import React, { useState } from "react";
import { useProvider } from "./ProviderContext";
import type { Provider } from "./ProviderContext";
import { useOS, operatingSystems } from "./OSSelector";

// Define available operating systems
export type OS = "MacOS / Linux" | "Windows";

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

export function InstallSnippet({ className = "" }: { className?: string }) {
  const { provider, providerInfo } = useProvider();
  const { os } = useOS();
  
  // Get the set environment variable command based on OS
  const setEnvCmd = os === "MacOS / Linux" ? "export" : "set";
  const apiKeyVar = providerApiKeys[provider];
  
  // Check if this provider has special install instructions
  const hasSpecialInstructions = provider in specialInstallInstructions;
  const specialInstructions = hasSpecialInstructions 
    ? specialInstallInstructions[provider][os]
    : `${setEnvCmd} ${apiKeyVar}=XXXX`;
  
  return (
    <div className={`my-4 ${className}`}>
      
      <pre>
        <code className="language-bash">
          {`pip install "mirascope[${providerInfo.packageName}]"\n${specialInstructions}`}
        </code>
      </pre>
    </div>
  );
}