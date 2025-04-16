import { codeToHtml } from "shiki";
import { transformerNotationHighlight } from "@shikijs/transformers";

/**
 * Function to parse meta information and add highlighting comments
 * Transforms meta information like {1-3,5} into [!code highlight] comments
 */
export function processCodeWithMetaHighlighting(
  code: string,
  meta: string,
  language: string
): string {
  if (!meta || !meta.includes("{") || !meta.includes("}")) {
    return code;
  }

  // Extract highlight information from meta: language{lines}
  const highlightMatch = meta.match(/{([^}]+)}/);
  if (!highlightMatch) return code;

  const highlightInfo = highlightMatch[1];
  const lines = code.split("\n");
  const lineHighlights = new Set<number>();

  // Process ranges like 1-3,5,7-9
  highlightInfo.split(",").forEach((part) => {
    if (part.includes("-")) {
      // Handle ranges like 1-3
      const [start, end] = part.split("-").map(Number);
      for (let i = start; i <= end; i++) {
        lineHighlights.add(i);
      }
    } else {
      // Handle single lines like 5
      lineHighlights.add(Number(part));
    }
  });

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

  // Add highlight comments to the specified lines
  const processedLines = lines.map((line, index) => {
    const lineNumber = index + 1;
    if (lineHighlights.has(lineNumber)) {
      // Add highlight marker to the end of the line
      if (line.trim() !== "") {
        return `${line} ${commentSyntax}`;
      } else {
        // Handle empty lines - add a space so the marker is visible
        return commentSyntax;
      }
    }
    return line;
  });

  return processedLines.join("\n");
}

// Generate HTML for highlighted code
export async function highlightCode(code: string, language: string = "text", meta: string = "") {
  try {
    // Process the code with meta information for line highlighting
    const processedCode = processCodeWithMetaHighlighting(code.trim(), meta, language);

    // Generate HTML for both light and dark themes
    // Using direct codeToHtml call from shiki
    const lightThemeHtml = await codeToHtml(processedCode, {
      lang: language || "text",
      theme: "github-light", // Use original theme
      transformers: [transformerNotationHighlight()],
    });

    const darkThemeHtml = await codeToHtml(processedCode, {
      lang: language || "text",
      theme: "github-dark-default", // Use original theme
      transformers: [transformerNotationHighlight()],
    });

    // Return both versions for theme switching
    return { lightThemeHtml, darkThemeHtml };
  } catch (error) {
    console.error(`Error highlighting code with language "${language}":`, error);

    // Fallback to a simple code block with escaped HTML
    const escapedCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    const fallbackHtml = `<pre class="shiki"><code>${escapedCode.trim()}</code></pre>`;
    return { lightThemeHtml: fallbackHtml, darkThemeHtml: fallbackHtml };
  }
}
