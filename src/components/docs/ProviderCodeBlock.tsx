import { useEffect, useState } from "react";
import { useProvider } from "./ProviderContext";
import { CodeBlock } from "../CodeBlock";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Wrench } from "lucide-react";

interface ProviderCodeBlockProps {
  examplePath: string; // Path relative to public/examples
  language?: string;
  className?: string;
  collapsible?: boolean;
  headerText?: string;
}

/**
 * Component that displays code examples specific to the selected provider.
 * Loads and displays examples from /public/examples/{examplePath}/sdk/{lowercaseProviderName}.py
 */
export function ProviderCodeBlock({
  examplePath,
  language = "python",
  className = "",
  collapsible = false,
  headerText = "",
}: ProviderCodeBlockProps) {
  // Get the currently selected provider
  const { provider } = useProvider();

  // State for code examples and loading
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // State for collapsible behavior - must be declared here, not conditionally
  // Default to collapsed when collapsible is true
  const [isExpanded, setIsExpanded] = useState(!collapsible);

  // Load all available provider code examples on mount
  useEffect(() => {
    async function loadProviderExamples() {
      setIsLoading(true);
      const newCodeMap: Record<string, string> = {};

      try {
        // Load the current provider's example
        const url = `/examples/${examplePath}/sdk/${provider}.py`;

        try {
          const response = await fetch(url);
          if (response.ok) {
            const text = await response.text();

            // Validate it's actual code and not an HTML error page
            if (
              text.trim().startsWith("<!DOCTYPE html>") ||
              text.trim().startsWith("<html") ||
              text.includes("<head>")
            ) {
              console.warn(`Got HTML instead of Python for ${provider}:`, text.substring(0, 100));
            } else {
              newCodeMap[provider] = text;
            }
          }
        } catch (err) {
          console.log(`Failed to load example for ${provider}:`, err);
        }

        setCodeMap(newCodeMap);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading provider examples:", err);
        setIsLoading(false);
      }
    }

    loadProviderExamples();
  }, [examplePath, provider]);

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

  // Toggle collapse/expand
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Display the code
  return (
    <div
      className={cn(
        "rounded-md border-2 border-blue-600/50 bg-[#191c20] shadow-md overflow-hidden",
        className
      )}
    >
      {collapsible && (
        <div
          className="px-4 py-2.5 flex items-center justify-between bg-blue-800/20 cursor-pointer"
          onClick={toggleExpand}
        >
          <div className="flex items-center">
            <div className="bg-blue-500 rounded-full p-0.5 mr-2 flex items-center justify-center w-5 h-5">
              <Wrench className="text-white w-3 h-3" />
            </div>
            <span className="text-white font-medium">{headerText || "Official SDK"}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-white" />
          ) : (
            <ChevronDown className="h-5 w-5 text-white" />
          )}
        </div>
      )}

      {isExpanded && (
        <div className="p-0 m-0">
          {!currentProviderCode && (
            <div className="px-4 py-2 text-sm text-yellow-300 bg-yellow-900/20">
              Example for {provider} not available yet.
            </div>
          )}
          <CodeBlock
            code={codeToDisplay}
            language={language}
            className="border-0 bg-transparent m-0 p-0"
          />
        </div>
      )}
    </div>
  );
}
