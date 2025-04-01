import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// Define available providers
export type Provider = 
  | "OpenAI" 
  | "Anthropic" 
  | "Mistral" 
  | "Google" 
  | "Groq" 
  | "xAI"
  | "Cohere" 
  | "LiteLLM" 
  | "Azure AI" 
  | "Bedrock";

// Re-export for convenience
export const providers: Provider[] = [
  "OpenAI", 
  "Anthropic", 
  "Google", 
  "Groq", 
  "xAI",
  "Mistral", 
  "Cohere", 
  "LiteLLM", 
  "Azure AI", 
  "Bedrock"
];

// Create a provider mapping for defaults
export const providerDefaults: Record<Provider, {
  packageName: string;
  defaultModel: string;
}> = {
  "OpenAI": {
    packageName: "openai",
    defaultModel: "gpt-4o",
  },
  "Anthropic": {
    packageName: "anthropic",
    defaultModel: "claude-3-opus-20240229",
  },
  "Mistral": {
    packageName: "mistralai",
    defaultModel: "mistral-large-latest",
  },
  "xAI": {
    packageName: "xai",
    defaultModel: "xai-001",
  },
  "Google": {
    packageName: "google",
    defaultModel: "gemini-1.5-pro",
  },
  "Groq": {
    packageName: "groq",
    defaultModel: "llama3-70b-8192",
  },
  "Cohere": {
    packageName: "cohere",
    defaultModel: "command-r-plus",
  },
  "LiteLLM": {
    packageName: "litellm",
    defaultModel: "gpt-4o",
  },
  "Azure AI": {
    packageName: "azure",
    defaultModel: "gpt-4o",
  },
  "Bedrock": {
    packageName: "bedrock",
    defaultModel: "anthropic.claude-3-opus-20240229",
  }
};

// Create a context to share the selected provider
interface ProviderContextType {
  provider: Provider;
  setProvider: (provider: Provider) => void;
  providerInfo: typeof providerDefaults[Provider];
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

// Provider component that wraps the content and provides the state
export function ProviderContextProvider({ children, defaultProvider = "OpenAI" }: { 
  children: ReactNode;
  defaultProvider?: Provider;
}) {
  const [provider, setProvider] = useState<Provider>(defaultProvider);
  
  // Get the provider info
  const providerInfo = providerDefaults[provider];

  return (
    <ProviderContext.Provider value={{ provider, setProvider, providerInfo }}>
      {children}
    </ProviderContext.Provider>
  );
}

// Hook to access the provider context
export function useProvider() {
  const context = useContext(ProviderContext);
  if (context === undefined) {
    throw new Error("useProvider must be used within a ProviderContextProvider");
  }
  return context;
}