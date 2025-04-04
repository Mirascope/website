import { useState, useEffect } from "react";
import { CodeBlock } from "../CodeBlock";
import Logo from "../Logo";
import { cn } from "@/lib/utils";

type ApiStyle = "Messages" | "String Template";

interface ApiStyleCodeBlockProps {
  examplePath: string;
  language?: string;
  className?: string;
  mirascopeHeader?: boolean;
}

export function ApiStyleCodeBlock({
  examplePath,
  language = "python",
  className = "",
  mirascopeHeader = false,
}: ApiStyleCodeBlockProps) {
  const [apiStyle, setApiStyle] = useState<ApiStyle>("Messages");
  const [messagesCode, setMessagesCode] = useState<string | null>(null);
  const [templatesCode, setTemplatesCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExamples() {
      setIsLoading(true);
      setError(null);

      try {
        const [messagesRes, templatesRes] = await Promise.all([
          fetch(`/examples/${examplePath}/messages.py`),
          fetch(`/examples/${examplePath}/template.py`),
        ]);

        if (!messagesRes.ok) {
          throw new Error(`Failed to load messages example (${messagesRes.status})`);
        }
        if (!templatesRes.ok) {
          throw new Error(`Failed to load templates example (${templatesRes.status})`);
        }

        const [messagesText, templatesText] = await Promise.all([
          messagesRes.text(),
          templatesRes.text(),
        ]);

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

  const codeToDisplay = apiStyle === "Messages" ? messagesCode : templatesCode;

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-blue-600/40 bg-[#191c20] shadow-md overflow-hidden",
          className
        )}
      >
        <div className="p-4 animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4 w-1/4"></div>
          <div className="h-5 bg-gray-800 rounded mb-2 w-3/4"></div>
          <div className="h-5 bg-gray-800 rounded mb-2"></div>
          <div className="h-5 bg-gray-800 rounded mb-2 w-5/6"></div>
          <div className="h-5 bg-gray-800 rounded mb-2 w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "rounded-xl border border-red-500 bg-[#191c20] shadow-md overflow-hidden",
          className
        )}
      >
        <div className="p-4">
          <p className="font-medium text-red-400">Error loading code examples</p>
          <p className="text-sm mt-1 text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  const tabs = ["Messages", "String Template"];

  return (
    <div
      className={cn(
        "rounded-md border-2 border-blue-600/50 bg-[#191c20] shadow-md overflow-hidden",
        className
      )}
    >
      {mirascopeHeader && (
        <div className="px-4 py-2.5 flex items-center bg-blue-800/20">
          <Logo size="micro" withText={true} textClassName="text-white opacity-90 font-medium" />
        </div>
      )}

      <div className="flex border-b border-gray-700 px-3 mt-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setApiStyle(tab as ApiStyle)}
            className={cn(
              "px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200 relative",
              tab === apiStyle && "text-white border-b-2 border-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-0 m-0">
        <CodeBlock
          code={codeToDisplay || "# Code example not available"}
          language={language}
          className="border-0 bg-transparent m-0 p-0"
        />
      </div>
    </div>
  );
}
