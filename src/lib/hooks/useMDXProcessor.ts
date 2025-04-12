import { useState, useEffect } from "react";
import { processMDX } from "@/lib/mdx-utils";

interface MDXProcessorResult {
  compiledMDX: {
    code: string;
    frontmatter: Record<string, any>;
  } | null;
  processing: boolean;
  error: string | null;
}

/**
 * Custom hook to process MDX content
 *
 * @param content - The MDX content to process
 * @param meta - Optional metadata for fallback rendering
 * @returns Object containing compiled MDX, processing state, and any error
 */
export function useMDXProcessor(
  content: string | null | undefined,
  meta?: Record<string, any>
): MDXProcessorResult {
  const [compiledMDX, setCompiledMDX] = useState<{
    code: string;
    frontmatter: Record<string, any>;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processContent = async () => {
      if (!content) {
        setCompiledMDX(null);
        return;
      }

      setProcessing(true);
      setError(null);

      try {
        const result = await processMDX(content);
        setCompiledMDX(result);
      } catch (err) {
        console.error("Error processing MDX:", err);

        // If metadata is provided, attempt to create simplified fallback content
        if (meta && meta.title) {
          try {
            const simplifiedContent = content.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "");

            const fallbackMdx = await processMDX(`
# ${meta.title}

${meta.description || ""}

**Error rendering full content. Showing simplified version.**

${simplifiedContent}
            `);
            setCompiledMDX(fallbackMdx);
          } catch (fallbackErr) {
            setError(
              `Could not render content: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        } else {
          setError(`Could not render content: ${err instanceof Error ? err.message : String(err)}`);
        }
      } finally {
        setProcessing(false);
      }
    };

    processContent();
  }, [content, meta]);

  return { compiledMDX, processing, error };
}

export default useMDXProcessor;
