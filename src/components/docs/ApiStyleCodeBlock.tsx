import { useState, useEffect } from "react";
import { CodeSnippet } from "./CodeSnippet";

// API style options
type ApiStyle = "messages" | "templates";

interface ApiStyleCodeBlockProps {
  examplePath: string; // Path relative to public/examples
  language?: string;
  className?: string;
  showSelector?: boolean; // Whether to show the style selector
}

export function ApiStyleCodeBlock({
  examplePath,
  language = "python",
  className = "",
  showSelector = true,
}: ApiStyleCodeBlockProps) {
  // Local state for API style
  const [apiStyle, setApiStyle] = useState<ApiStyle>("messages");
  
  
  // State for code examples
  const [messagesCode, setMessagesCode] = useState<string | null>(null);
  const [templatesCode, setTemplatesCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load both code examples at component mount
  useEffect(() => {
    async function loadExamples() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch both files in parallel
        const [messagesRes, templatesRes] = await Promise.all([
          fetch(`/examples/${examplePath}/messages.py`),
          fetch(`/examples/${examplePath}/template.py`)
        ]);

        // Check for HTTP errors
        if (!messagesRes.ok) {
          throw new Error(`Failed to load messages example (${messagesRes.status})`);
        }
        if (!templatesRes.ok) {
          throw new Error(`Failed to load templates example (${templatesRes.status})`);
        }

        // Get the text content
        const [messagesText, templatesText] = await Promise.all([
          messagesRes.text(),
          templatesRes.text()
        ]);

        // Store the code
        setMessagesCode(messagesText);
        setTemplatesCode(templatesText);
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading code examples:", err);
        setError(err instanceof Error ? err.message : String(err));
        setIsLoading(false);
      }
    }

    loadExamples();
  }, [examplePath]);

  // API Style selector component
  const StyleSelector = () => {
    if (!showSelector) return null;
    
    const styles: ApiStyle[] = ["messages", "templates"];

    return (
      <div className={`my-4`}>
        <h4 className="text-sm font-medium mb-2">API Style:</h4>
        <div className="flex gap-2">
          {styles.map((style) => (
            <button
              key={style}
              onClick={() => setApiStyle(style)}
              className={`px-3 py-1 text-sm rounded-md transition-colors capitalize ${
                apiStyle === style
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className={className}>
        <StyleSelector />
        <div className="my-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-5/6"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-2/3"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={className}>
        <StyleSelector />
        <div className="my-4 p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 rounded">
          <p className="font-medium">Error loading code examples</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Display the appropriate code based on API style
  const codeToDisplay = apiStyle === "messages" ? messagesCode : templatesCode;

  // The CodeSnippet will handle the variable replacement
  return (
    <div className={className}>
      <StyleSelector />
      <CodeSnippet
        code={codeToDisplay || "// Code example not available"}
        language={language}
      />
    </div>
  );
}