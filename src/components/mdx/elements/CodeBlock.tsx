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
  const [isSmallBlock, setIsSmallBlock] = useState<boolean>(false);

  // Base styles for code block container
  const codeBlockBaseStyles =
    "code-block-wrapper border-card relative m-0 mb-2 rounded-md overflow-hidden border p-0 text-sm";

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

  // Check if code block is small after rendering
  useEffect(() => {
    if (codeRef.current) {
      // Get the height of the code block
      const height = codeRef.current.clientHeight;
      // Consider blocks less than 100px as small
      setIsSmallBlock(height < 100);
    }
  }, [isLoading, lightHtml, darkHtml]);

  const copyToClipboard = () => {
    // Strip highlight markers before copying to clipboard
    const cleanCode = stripHighlightMarkers(code);
    navigator.clipboard.writeText(cleanCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);

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
    const pagePath = window.location.pathname;
    const docsMatch = pagePath.match(/^\/doc\/([^/]+)/);
    if (docsMatch && docsMatch[1]) {
      product = docsMatch[1];
    }

    analyticsManager.trackCopyEvent({
      contentType: "code_snippet",
      itemId: `${pagePath}#code-${blockPosition}`,
      product: product,
      language: language || "text",
    });
  };

  // If loading, just show the code without syntax highlighting to maintain size
  if (isLoading) {
    return (
      <div className={cn(codeBlockBaseStyles, className)}>
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
        codeBlockBaseStyles,
        "group", // Enables group-hover functionality for button visibility
        funMode && "fun-mode",
        className
      )}
    >
      {/* Buttons - positioned based on block size */}
      <div
        className={cn(
          "absolute z-10 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-80 sm:opacity-0",
          isSmallBlock ? "top-1/2 right-3 flex -translate-y-1/2 space-x-1" : "top-3 right-3"
        )}
      >
        {/* Fun mode button - positioned to the left of copy button for small blocks */}
        {isSmallBlock && (
          <button
            className="bg-background hover:bg-muted relative cursor-pointer rounded-md border p-1.5"
            onClick={toggleFunMode}
            aria-label="Toggle fun mode"
            title="Toggle fun mode"
          >
            <Sparkles
              className={cn("h-4 w-4", funMode ? "text-primary" : "text-muted-foreground")}
            />
          </button>
        )}

        {/* Copy button */}
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

      {/* Fun mode button in bottom right for normal sized blocks */}
      {!isSmallBlock && (
        <div className="absolute right-3 bottom-3 z-10 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-80 sm:opacity-0">
          <button
            className="bg-background hover:bg-muted relative cursor-pointer rounded-md border p-1.5"
            onClick={toggleFunMode}
            aria-label="Toggle fun mode"
            title="Toggle fun mode"
          >
            <Sparkles
              className={cn("h-4 w-4", funMode ? "text-primary" : "text-muted-foreground")}
            />
          </button>
        </div>
      )}

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
