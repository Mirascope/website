import { useEffect, useState, useRef } from "react";
import { highlightCode, stripHighlightMarkers } from "@/src/lib/code-highlight";
import analyticsManager from "@/src/lib/services/analytics";
import { Sparkles } from "lucide-react";
import { cn } from "@/src/lib/utils";
import useFunMode from "@/src/lib/hooks/useFunMode";

interface CodeBlockProps {
  code: string;
  language?: string;
  meta?: string;
  className?: string;
}

export function CodeBlock({ code, language = "text", meta = "", className = "" }: CodeBlockProps) {
  const [lightHtml, setLightHtml] = useState<string>("");
  const [darkHtml, setDarkHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [funMode, toggleFunMode] = useFunMode();
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function highlight() {
      setIsLoading(true);
      try {
        const { lightThemeHtml, darkThemeHtml } = await highlightCode(code, language, meta);
        setLightHtml(lightThemeHtml);
        setDarkHtml(darkThemeHtml);
      } catch (error) {
        console.error("Error highlighting code:", error);
        // Fallback to plain pre/code in case of error
        const escapedCode = code
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");

        const fallbackHtml = `<pre class="language-${language}"><code>${escapedCode}</code></pre>`;
        setLightHtml(fallbackHtml);
        setDarkHtml(fallbackHtml);
      } finally {
        setIsLoading(false);
      }
    }

    highlight();
  }, [code, language, meta]);

  const copyToClipboard = () => {
    // Strip highlight markers before copying to clipboard
    const cleanCode = stripHighlightMarkers(code);
    navigator.clipboard.writeText(cleanCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);

    // Track code copy event
    const pagePath = window.location.pathname;

    // Find position of this code block on the page
    let blockPosition = 0;
    if (codeRef.current) {
      const allCodeBlocks = document.querySelectorAll(".code-block-wrapper");
      for (let i = 0; i < allCodeBlocks.length; i++) {
        if (allCodeBlocks[i] === codeRef.current) {
          blockPosition = i + 1; // Make it 1-based for readability
          break;
        }
      }
    }

    // Extract product from URL path if in docs section
    let product = "unknown";
    const docsMatch = pagePath.match(/^\/doc\/([^/]+)/);
    if (docsMatch && docsMatch[1]) {
      product = docsMatch[1];
    }

    analyticsManager.trackEvent("select_content", {
      content_type: "code_snippet",
      item_id: `${pagePath}#code-${blockPosition}`,
      language: language || "text",
      product: product,
      page_path: pagePath,
    });
  };

  // If loading, just show the code without syntax highlighting to maintain size
  if (isLoading) {
    return (
      <div
        className={`code-block-wrapper border-border relative m-0 overflow-hidden border p-0 text-sm ${className}`}
      >
        <pre className="bg-button-primary m-0 p-4">
          <code className="opacity-0">{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={codeRef}
      className={cn(
        "code-block-wrapper group border-border relative m-0 overflow-hidden border p-0 text-sm",
        funMode && "fun-mode",
        className
      )}
    >
      {/* Copy button in top right */}
      <div className="absolute top-3 right-3 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          className="bg-background hover:bg-muted relative cursor-pointer rounded-md border p-1.5"
          onClick={copyToClipboard}
          aria-label="Copy code"
          title="Copy code"
        >
          {isCopied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          )}
        </button>
      </div>

      {/* Fun mode button in bottom right (easter egg) */}
      <div className="absolute right-3 bottom-3 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          className="bg-background hover:bg-muted relative cursor-pointer rounded-md border p-1.5"
          onClick={toggleFunMode}
          aria-label="Toggle fun mode"
          title="Toggle fun mode"
        >
          <Sparkles className={cn("h-4 w-4", funMode ? "text-primary" : "text-muted-foreground")} />
        </button>
      </div>

      {/* Light theme code */}
      <div
        className="light-theme-code w-full text-sm dark:hidden"
        dangerouslySetInnerHTML={{ __html: lightHtml }}
      />

      {/* Dark theme code */}
      <div
        className="dark-theme-code hidden w-full text-sm dark:block"
        dangerouslySetInnerHTML={{ __html: darkHtml }}
      />
    </div>
  );
}
