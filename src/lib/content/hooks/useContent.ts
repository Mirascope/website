import { useState, useEffect } from "react";
import type { ContentMeta } from "@/lib/content/content-types";
import type { ContentTypeHandler } from "@/lib/content/handlers/content-type-handler";
import { processMDX } from "@/lib/mdx-utils";

export interface Content<T extends ContentMeta = ContentMeta> {
  meta: T;
  rawContent: string;
  mdx: {
    code: string;
    frontmatter: Record<string, any>;
  } | null;
}

export interface ContentResult<T extends ContentMeta = ContentMeta> {
  content: Content<T> | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Base hook for loading and processing content
 * This is a private implementation - components should use the type-specific hooks
 */
export function useContent<T extends ContentMeta>(
  path: string,
  handler: ContentTypeHandler<T>
): ContentResult<T> {
  const [result, setResult] = useState<ContentResult<T>>({
    content: null,
    loading: true,
    error: null,
  });

  // Load the content
  useEffect(() => {
    let isMounted = true;

    const fetchContent = async () => {
      try {
        setResult((prev) => ({ ...prev, loading: true, error: null }));

        const doc = await handler.getDocument(path);

        if (!isMounted) return;

        // Process the MDX content
        if (doc.content) {
          try {
            const mdx = await processMDX(doc.content);

            if (isMounted) {
              setResult({
                content: {
                  meta: doc.meta as T,
                  rawContent: doc.content,
                  mdx,
                },
                loading: false,
                error: null,
              });
            }
          } catch (mdxError) {
            console.error(`Error processing MDX:`, mdxError);

            if (isMounted) {
              // We still have the content, just couldn't process the MDX
              setResult({
                content: {
                  meta: doc.meta as T,
                  rawContent: doc.content,
                  mdx: null,
                },
                loading: false,
                error: mdxError instanceof Error ? mdxError : new Error(String(mdxError)),
              });
            }
          }
        } else {
          // Handle case where content is empty
          setResult({
            content: {
              meta: doc.meta as T,
              rawContent: "",
              mdx: null,
            },
            loading: false,
            error: null,
          });
        }
      } catch (fetchError) {
        if (isMounted) {
          console.error(`Error loading content:`, fetchError);
          setResult({
            content: null,
            loading: false,
            error: fetchError instanceof Error ? fetchError : new Error(String(fetchError)),
          });
        }
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, [path, handler]);

  return result;
}
