import { useEffect, useState } from "react";
import { useProvider, providers, providerDefaults } from "./ProviderContext";
import { CodeSnippet } from "./CodeSnippet";

interface ProviderCodeBlockProps {
  examplePath: string; // Path relative to public/examples
  language?: string;
  className?: string;
}

/**
 * Component that displays code examples specific to the selected provider.
 * Loads and displays examples from /public/examples/{examplePath}/sdk/{lowercaseProviderName}.py
 */
export function ProviderCodeBlock({
  examplePath,
  language = "python",
  className = "",
}: ProviderCodeBlockProps) {
  // Get the currently selected provider
  const { provider } = useProvider();
  
  // State for code examples and loading
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load all available provider code examples on mount
  useEffect(() => {
    async function loadProviderExamples() {
      setIsLoading(true);
      const newCodeMap: Record<string, string> = {};
      
      try {
        // Try to load all providers in parallel
        const loadPromises = providers.map(async (p) => {
          // Use the packageName from providerDefaults
          const { packageName } = providerDefaults[p];
          const url = `/examples/${examplePath}/sdk/${packageName}.py`;
          
          try {
            const response = await fetch(url);
            if (response.ok) {
              const text = await response.text();
              
              // Validate it's actual code and not an HTML error page
              if (text.trim().startsWith('<!DOCTYPE html>') || 
                  text.trim().startsWith('<html') || 
                  text.includes('<head>')) {
                console.warn(`Got HTML instead of Python for ${p}:`, text.substring(0, 100));
                return { provider: p, success: false };
              }
              
              newCodeMap[p] = text;
              return { provider: p, success: true };
            }
            return { provider: p, success: false };
          } catch (err) {
            console.log(`Failed to load example for ${p}:`, err);
            return { provider: p, success: false };
          }
        });
        
        // Wait for all fetch operations to complete
        await Promise.all(loadPromises);
        
        setCodeMap(newCodeMap);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading provider examples:", err);
        setIsLoading(false);
      }
    }

    loadProviderExamples();
  }, [examplePath]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={`my-4 ${className}`}>
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-5/6"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-2/3"></div>
        </div>
      </div>
    );
  }

  // Find the code for the current provider
  const currentProviderCode = codeMap[provider];
  
  // If we don't have code for the current provider, show an empty code block
  const codeToDisplay = currentProviderCode || "// No example available for this provider yet";

  // Display the code
  return (
    <div className={className}>
      {!currentProviderCode && (
        <div className="mb-2 px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded">
          Example for {provider} not available yet.
        </div>
      )}
      <CodeSnippet
        code={codeToDisplay}
        language={language}
      />
    </div>
  );
}