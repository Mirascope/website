import React, { useState, useEffect } from "react";
import { codeToHtml } from "shiki";
import { transformerNotationHighlight } from "@shikijs/transformers";

type MDXContentProps = {
  source: string;
};

// Function to parse meta information and add highlight markers to code
const processCodeWithMetaHighlighting = (
  code: string,
  meta: string,
  language: string
): string => {
  // If no meta or no highlighting info, return code as is
  if (!meta || !meta.match(/^\{.*\}$/)) {
    return code;
  }

  // Extract line numbers from meta (e.g., "{1,2-4}" -> [1,2,3,4])
  const highlightedLineNumbers = new Set<number>();

  // Remove curly braces and split by comma
  const segments = meta.slice(1, -1).split(",");

  for (const segment of segments) {
    if (segment.includes("-")) {
      // It's a range like "2-4"
      const [start, end] = segment.split("-").map(Number);
      for (let i = start; i <= end; i++) {
        highlightedLineNumbers.add(i);
      }
    } else {
      // It's a single line like "1"
      const lineNum = Number(segment);
      highlightedLineNumbers.add(lineNum);
    }
  }

  // If no lines to highlight, return code as is
  if (highlightedLineNumbers.size === 0) {
    return code;
  }

  // Get the appropriate comment syntax based on language
  const getCommentSyntax = (lang: string): string => {
    // Different comment syntaxes for different languages
    switch (lang.toLowerCase()) {
      case "html":
      case "xml":
      case "svg":
      case "markdown":
      case "md":
        return "<!-- [!code highlight] -->";
      case "css":
      case "scss":
      case "less":
        return "/* [!code highlight] */";
      case "python":
      case "ruby":
      case "shell":
      case "bash":
      case "sh":
      case "yaml":
      case "yml":
        return "# [!code highlight]";
      case "sql":
        return "-- [!code highlight]";
      default:
        // Default to C-style comments (JavaScript, TypeScript, Java, C, C++, etc.)
        return "// [!code highlight]";
    }
  };

  const commentSyntax = getCommentSyntax(language);

  // Split the code into lines, add highlight markers, and join back
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    // Line numbers are 1-based in the meta
    if (highlightedLineNumbers.has(i + 1)) {
      // Add highlight marker to the end of the line
      if (lines[i].trim() !== "") {
        lines[i] = lines[i] + " " + commentSyntax;
      } else {
        // Handle empty lines - add a space so the marker is visible
        lines[i] = commentSyntax;
      }
    }
  }

  return lines.join("\n");
};

// Simple markdown parser for content
const parseMarkdown = async (markdown: string): Promise<string> => {
  // First extract code blocks and replace them with placeholders
  const codeBlocks: Array<{ language: string; code: string; meta: string }> =
    [];
  let processedMd = markdown.replace(
    /```([\w-]*)(?: +({.*?}))?\n([\s\S]*?)```/gm,
    (match, lang, meta, code) => {
      const id = codeBlocks.length;
      codeBlocks.push({
        language: lang || "text",
        code: code.trim(), // Trim the code to remove extra whitespace
        meta: meta || "",
      });
      return `__CODE_BLOCK_${id}__`;
    }
  );

  // Process the rest of the markdown
  // First, remove the first h1 header (title) since it's already shown at the top of the page
  const firstH1Match = processedMd.match(/^# (.*$)/m);
  if (firstH1Match) {
    // Remove the first h1 header from the markdown
    processedMd = processedMd.replace(firstH1Match[0], '');
  }

  // Create a slug function for headings
  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  processedMd = processedMd
    // Headers - process remaining headers with IDs for linking
    .replace(
      /^# (.*$)/gm,
      (match, p1) => {
        const headingId = slugify(p1);
        return `<h1 id="${headingId}" class="text-3xl font-bold my-6 scroll-mt-28">${p1}</h1>`;
      }
    )
    .replace(
      /^## (.*$)/gm,
      (match, p1) => {
        const headingId = slugify(p1);
        return `<h2 id="${headingId}" class="text-2xl font-semibold my-5 scroll-mt-28">${p1}</h2>`;
      }
    )
    .replace(
      /^### (.*$)/gm,
      (match, p1) => {
        const headingId = slugify(p1);
        return `<h3 id="${headingId}" class="text-xl font-medium my-4 scroll-mt-28">${p1}</h3>`;
      }
    )
    .replace(
      /^#### (.*$)/gm,
      (match, p1) => {
        const headingId = slugify(p1);
        return `<h4 id="${headingId}" class="text-lg font-medium my-3 scroll-mt-28">${p1}</h4>`;
      }
    )
    .replace(
      /^##### (.*$)/gm,
      (match, p1) => {
        const headingId = slugify(p1);
        return `<h5 id="${headingId}" class="text-base font-medium my-3 scroll-mt-28">${p1}</h5>`;
      }
    )

    // Links - process before inline code to avoid conflicts with code backticks
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-blue-600 dark:text-blue-400 hover:underline no-underline">$1</a>'
    )

    // Inline code
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm font-mono">$1</code>'
    )

    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")

    // Unordered lists
    .replace(/^- (.*)/gm, '<ul class="list-disc pl-5 my-4"><li>$1</li></ul>')
    .replace(/^\* (.*)/gm, '<ul class="list-disc pl-5 my-4"><li>$1</li></ul>')
    
    // Ordered lists
    .replace(/^\d+\. (.*)/gm, '<ol class="list-decimal pl-5 my-4"><li>$1</li></ol>')
    
    // Paragraphs (must come after lists)
    .replace(/^(?!<)(?!#)(?!-)(?!\*)(?!\d+\.)(.*)/gm, '<p class="my-3">$1</p>')

    // Fix any duplicate tags or common issues
    .replace(/<\/ul>\s*<\/ul>/g, "</ul>")
    .replace(/<\/ol>\s*<\/ol>/g, "</ol>");

  // Now put the code blocks back with Shiki syntax highlighting
  for (let i = 0; i < codeBlocks.length; i++) {
    const { language, code, meta } = codeBlocks[i];

    // Process the code with meta information to add [!code highlight] comments
    // Ensure code is trimmed to remove extra whitespace
    const processedCode = processCodeWithMetaHighlighting(code.trim(), meta, language);

    try {
      // Create highlighted versions for both light and dark themes
      const lightThemeCode = await codeToHtml(processedCode, {
        lang: language,
        theme: "one-light",
        transformers: [transformerNotationHighlight()],
      });

      const darkThemeCode = await codeToHtml(processedCode, {
        lang: language,
        theme: "dark-plus",
        transformers: [transformerNotationHighlight()],
      });

      // Wrap with styling and add copy button with theme detection script
      const codeBlock = `<div class="code-block-wrapper relative group rounded-lg overflow-hidden my-6 border border-gray-100 dark:border-gray-800">
          <button 
            class="copy-button absolute border right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-white dark:bg-[#282c34] hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            onclick="
              const code = this.parentNode.querySelector('code').innerText;
              navigator.clipboard.writeText(code);
              this.innerHTML = '<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'20 6 9 17 4 12\\'></polyline></svg>';
              setTimeout(() => {
                this.innerHTML = '<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'16\\' height=\\'16\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><rect x=\\'9\\' y=\\'9\\' width=\\'13\\' height=\\'13\\' rx=\\'2\\' ry=\\'2\\'></rect><path d=\\'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\\'></path></svg>';
              }, 2000);
            "
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <div class="light-theme-code dark:hidden">${lightThemeCode}</div>
          <div class="dark-theme-code hidden dark:block">${darkThemeCode}</div>
        </div>`;

      // Replace the placeholder
      processedMd = processedMd.replace(`__CODE_BLOCK_${i}__`, codeBlock);
    } catch (error) {
      console.error(
        `Error highlighting code with language "${language}":`,
        error
      );

      // Fallback to a simple code block with escaped HTML
      const escapedCode = code
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

      const fallbackBlock = `<pre class="rounded-lg p-4 my-6 bg-gray-100 dark:bg-gray-800 overflow-x-auto border border-gray-200 dark:border-gray-700"><code class="font-mono text-sm whitespace-pre">${escapedCode.trim()}</code></pre>`;

      processedMd = processedMd.replace(`__CODE_BLOCK_${i}__`, fallbackBlock);
    }
  }

  return processedMd;
};

const MDXContent: React.FC<MDXContentProps> = ({ source }) => {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const renderMarkdown = async () => {
      try {
        // Skip frontmatter if present (previously extracted by the data loader)
        const contentNoFrontmatter = source.replace(/^---\n[\s\S]*?\n---\n/, '');
        
        // Remove sourcemap comments that might appear at the end of the content
        const cleanedContent = contentNoFrontmatter.replace(/\/\/# sourceMappingURL=.*$/, '');
        
        const processedHtml = await parseMarkdown(cleanedContent);
        setHtml(processedHtml);
      } catch (error) {
        console.error("Error processing markdown:", error);
      } finally {
        setLoading(false);
      }
    };

    renderMarkdown();
  }, [source]);

  if (loading) {
    return <div className="animate-pulse bg-gray-100 h-40 rounded-md"></div>;
  }

  return (
    <div className="prose prose-slate max-w-none">
      {/* Styles for blog post content and code highlighting */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Base styles for Shiki */
        .shiki {
          margin: 0 !important;
          padding: 1rem !important;
          width: 100% !important;
          overflow-x: auto !important;
          font-size: 0.9rem !important;
          position: relative !important;
        }
        
        /* Ensure the code doesn't get additional styling */
        .shiki code {
          background: transparent !important;
          padding: 0 !important;
          font-size: inherit !important;
          counter-reset: step;
          counter-increment: step 0;
        }
        
        /* Ensure consistent line heights */
        .shiki .line {
          line-height: 1.5 !important;
          min-height: 1.5em !important;
        }

        .shiki .line::before {
          content: counter(step);
          counter-increment: step;
          width: 1rem;
          margin-right: 1.5rem;
          display: inline-block;
          text-align: right;
          color: rgba(115,138,148,.4)
        }
        
        /* Line highlighting styles for the shiki transformer */
        .shiki .highlighted,
        .shiki [data-highlighted],
        .shiki .line[data-highlighted="true"] {
          background-color: rgba(124, 58, 237, 0.07) !important; /* More purple background (violet-600 with opacity) */
          border-left: 3px solid #6366f1 !important; /* Violet-600 color */
          margin-left: -1rem !important;
          padding-left: calc(1rem - 3px) !important;
          box-shadow: 9999px 0 0 0 rgba(124, 58, 237, 0.07) !important; /* Extend highlight to the right */
          margin-right: -100vw !important; /* Make sure it extends beyond container */
          padding-right: 100vw !important; /* Add padding to fill the space */
          display: inline-block !important;
        }
        
        .dark-theme-code .shiki .highlighted,
        .dark-theme-code .shiki [data-highlighted],
        .dark-theme-code .shiki .line[data-highlighted="true"] {
          background-color: rgba(139, 92, 246, 0.1) !important; /* More purple for dark mode (violet-500 with opacity) */
          border-left-color: #6366f1 !important; /* Violet-500 color for dark mode */
          box-shadow: 9999px 0 0 0 rgba(139, 92, 246, 0.1) !important; /* Extend highlight to the right in dark mode */
        }
        
        /* Copy button styling */
        .copy-button {
          z-index: 10;
          transition: all 0.2s ease;
        }
        
        .copy-button:active {
          transform: scale(0.95);
        }
        
        /* Ensure SVG icons have the right color */
        .copy-button svg {
          color: #6B7280;
        }
        
        .dark .copy-button svg {
          color: #9CA3AF;
        }
      `,
        }}
      />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
};

export default MDXContent;