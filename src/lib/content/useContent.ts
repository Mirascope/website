import { useState, useEffect, useCallback } from "react";
import type { ContentMeta, ContentResult, GetContentFn } from "@/src/lib/content/types";

/**
 * Base hook for loading and processing content
 * This is a private implementation - components should use the type-specific hooks
 */
export function useContent<T extends ContentMeta>(
  path: string,
  getContent: GetContentFn<T>
): ContentResult<T> {
  const [result, setResult] = useState<ContentResult<T>>({
    content: null,
    loading: true,
    error: null,
  });

  // Memoize the fetch function to maintain referential equality
  const fetchContent = useCallback(async () => {
    try {
      setResult((prev) => ({ ...prev, loading: true, error: null }));

      // Get the content from the handler (already processed)
      const content = await getContent(path);

      // Successfully loaded content
      setResult({
        content,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error(`Error loading content:`, error);
      setResult({
        content: null,
        loading: false,
        error: error instanceof Error ? error : new Error(`Content loading failed: ${error}`),
      });
    }
  }, [path, getContent]);

  // Load the content when path or getContent changes
  useEffect(() => {
    let isMounted = true;

    fetchContent().catch((error) => {
      if (isMounted) {
        console.error("Unexpected error in content loading:", error);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [fetchContent]);

  return result;
}
