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
  "Bedrock",
];

// Create a provider mapping for defaults
export const providerDefaults: Record<
  Provider,
  {
    packageName: string;
    defaultModel: string;
  }
> = {
  OpenAI: {
    packageName: "openai",
    defaultModel: "gpt-4o-mini",
  },
  Anthropic: {
    packageName: "anthropic",
    defaultModel: "claude-3-5-sonnet-latest",
  },
  Mistral: {
    packageName: "mistral",
    defaultModel: "mistral-large-latest",
  },
  xAI: {
    packageName: "xai",
    defaultModel: "grok-3",
  },
  Google: {
    packageName: "google",
    defaultModel: "gemini-2.0-flash",
  },
  Groq: {
    packageName: "groq",
    defaultModel: "llama-3.1-70b-versatile",
  },
  Cohere: {
    packageName: "cohere",
    defaultModel: "command-r-plus",
  },
  LiteLLM: {
    packageName: "litellm",
    defaultModel: "gpt-4o-mini",
  },
  "Azure AI": {
    packageName: "azure",
    defaultModel: "gpt-4o-mini",
  },
  Bedrock: {
    packageName: "bedrock",
    defaultModel: "amazon.nova-lite-v1:0",
  },
};

// Create a context to share the selected provider
interface ProviderContextType {
  provider: Provider;
  setProvider: (provider: Provider) => void;
  providerInfo: (typeof providerDefaults)[Provider];
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

// Provider component that wraps the content and provides the state
export function ProviderContextProvider({
  children,
  defaultProvider = "OpenAI",
  onProviderChange,
}: {
  children: ReactNode;
  defaultProvider?: Provider;
  onProviderChange?: (provider: Provider) => void;
}) {
  const [provider, setProvider] = useState<Provider>(defaultProvider);

  // Create a wrapper for setProvider that calls the callback when provided
  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    if (onProviderChange) {
      onProviderChange(newProvider);
    }
  };

  // Get the provider info
  const providerInfo = providerDefaults[provider];

  return (
    <ProviderContext.Provider
      value={{
        provider,
        setProvider: handleProviderChange,
        providerInfo,
      }}
    >
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
