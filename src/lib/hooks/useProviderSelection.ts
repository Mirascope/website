import { useState } from "react";
import { providers, type Provider } from "@/src/config/providers";

/**
 * Custom hook to manage provider selection with localStorage persistence
 *
 * @returns [selectedProvider, handleProviderChange] - Current provider and change handler
 */
export function useProviderSelection(): [Provider, (provider: string) => void] {
  // Helper function to validate a provider string
  const validateProvider = (provider: string | null): Provider => {
    if (!provider || !providers.includes(provider as Provider)) {
      return "openai"; // Default fallback if invalid
    }
    return provider as Provider;
  };

  // Initialize Provider from localStorage if available
  const [selectedProvider, setSelectedProvider] = useState<Provider>(() => {
    if (typeof window !== "undefined") {
      const savedProvider = localStorage.getItem("selectedProvider");
      return validateProvider(savedProvider);
    }
    return "openai";
  });

  // Handle provider change and save to localStorage
  const handleProviderChange = (provider: string) => {
    const validProvider = validateProvider(provider);
    setSelectedProvider(validProvider);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedProvider", validProvider);
    }
  };

  return [selectedProvider, handleProviderChange];
}

export default useProviderSelection;
