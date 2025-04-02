import React, { useEffect, useState, useRef } from "react";
import { highlightCode } from "@/lib/code-highlight";

interface CodeBlockProps {
  code: string;
  language?: string;
  meta?: string;
  className?: string;
}

export function CodeBlock({
  code,
  language = "text",
  meta = "",
  className = "",
}: CodeBlockProps) {
  const [lightHtml, setLightHtml] = useState<string>("");
  const [darkHtml, setDarkHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const codeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function highlight() {
      setIsLoading(true);
      try {
        const { lightThemeHtml, darkThemeHtml } = await highlightCode(
          code,
          language,
          meta
        );
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
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div
        className={`code-block-wrapper ${className} animate-pulse bg-gray-100 dark:bg-gray-800 h-32 rounded-lg`}
      ></div>
    );
  }

  return (
    <div
      ref={codeRef}
      className={`code-block-wrapper relative group rounded-lg overflow-hidden my-6 border border-gray-100 dark:border-gray-800 ${className}`}
    >
      <button
        className="copy-button absolute border right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-white dark:bg-[#282c34] hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        onClick={copyToClipboard}
        aria-label="Copy code to clipboard"
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

      {/* Light theme code */}
      <div
        className="light-theme-code dark:hidden w-full"
        dangerouslySetInnerHTML={{ __html: lightHtml }}
      />

      {/* Dark theme code */}
      <div
        className="dark-theme-code hidden dark:block w-full"
        dangerouslySetInnerHTML={{ __html: darkHtml }}
      />
    </div>
  );
}
