import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
// Import from shared config file
import type { Provider } from "@/src/config/providers";
import { providers, providerDefaults } from "@/src/config/providers";

// Re-export these for backward compatibility
export type { Provider };
export { providers, providerDefaults };

// Create a context to share the selected provider
interface ProviderContextType {
  provider: Provider;
  setProvider: (provider: Provider) => void;
  providerInfo: {
    displayName: string;
    defaultModel: string;
  };
}

const ProviderContext = createContext<ProviderContextType | undefined>(undefined);

// Provider component that wraps the content and provides the state
export function ProviderContextProvider({
  children,
  defaultProvider = "openai",
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

// Default provider to use when outside of ProviderContextProvider
const defaultProvider: Provider = "openai";

// Hook to access the provider context
export function useProvider() {
  const context = useContext(ProviderContext);
  if (context === undefined) {
    // Return a default context when no provider is available
    // This happens in blog posts or other areas without the provider dropdown
    return {
      provider: defaultProvider,
      setProvider: () => {
        console.warn("Attempted to set provider outside of ProviderContextProvider");
      },
      providerInfo: providerDefaults[defaultProvider],
    };
  }
  return context;
}
