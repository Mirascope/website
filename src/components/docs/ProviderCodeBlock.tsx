import { useEffect, useState } from "react";
import { LoadingContent } from "@/src/components/docs";
import { useProvider } from "./ProviderContext";
import { CodeBlock } from "../CodeBlock";
import { cn } from "@/src/lib/utils";
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
        const url = `/examples/${examplePath}/${provider}.py`;

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
          console.error(`Failed to load example for ${provider}:`, err);
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
        <LoadingContent spinnerClassName="h-8 w-8" fullHeight={false} />
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
        "bg-secondary/10 border-secondary overflow-hidden rounded-md shadow-md",
        className
      )}
    >
      {collapsible && (
        <div
          className="flex cursor-pointer items-center justify-between px-4 py-2.5"
          onClick={toggleExpand}
        >
          <div className="flex items-center">
            <div className="mr-2 flex h-5 w-5 items-center justify-center rounded-full p-0.5">
              <Wrench className="text-secondary h-3 w-3" />
            </div>
            <span className="text-foreground font-medium">{headerText || "Official SDK"}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="text-foreground h-5 w-5" />
          ) : (
            <ChevronDown className="text-foreground h-5 w-5" />
          )}
        </div>
      )}

      {isExpanded && (
        <div className="m-0 p-0">
          {!currentProviderCode && (
            <div className="bg-destructive/20 text-destructive px-4 py-2 text-sm">
              Example for {provider} not available yet.
            </div>
          )}
          <CodeBlock code={codeToDisplay} language={language} />
        </div>
      )}
    </div>
  );
}
