import { useState, useEffect } from "react";
import type { PolicyMeta } from "@/lib/content/content-types";
import { policyContentHandler } from "@/lib/content/handlers/policy-content-handler";
import { processMDX } from "@/lib/mdx-utils";

export interface UsePolicyResult {
  policyMeta: PolicyMeta;
  compiledMDX: {
    code: string;
    frontmatter: Record<string, any>;
  } | null;
  loading: boolean;
  error: string | null;
}

/**
 * Converts a source file path to a policy path that can be used with the content handler
 * Example: "/src/policies/terms/use.mdx" -> "terms/use"
 */
function filePathToPolicyPath(filePath: string): string {
  // Remove "/src/policies/" prefix and ".mdx" suffix
  const withoutPrefix = filePath.replace(/^\/src\/policies\//, "");
  const withoutExtension = withoutPrefix.replace(/\.mdx$/, "");
  return withoutExtension;
}

/**
 * Custom hook to fetch and process policy content using the PolicyContentHandler
 *
 * @param policyPath - Path to the policy MDX file
 * @param defaultTitle - Default title to use if metadata is missing
 * @returns Object containing policy metadata, compiled MDX, loading state, and error
 */
export function usePolicy(policyPath: string, defaultTitle: string): UsePolicyResult {
  const [policyMeta, setPolicyMeta] = useState<PolicyMeta | null>(null);
  const [compiledMDX, setCompiledMDX] = useState<{
    code: string;
    frontmatter: Record<string, any>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPolicy = async () => {
      try {
        // Convert source path to policy path for the content handler
        const policyId = filePathToPolicyPath(policyPath);
        console.log(`[usePolicy] Loading policy with ID: ${policyId}`);

        // Use the policy content handler to get the document
        const policyDoc = await policyContentHandler.getDocument(policyId);

        // Process the MDX content
        const processed = await processMDX(policyDoc.content);

        setPolicyMeta(policyDoc.meta);
        setCompiledMDX(processed);
        setLoading(false);
      } catch (err) {
        console.error(`[usePolicy] Error loading policy from ${policyPath}:`, err);
        setError(
          `Failed to load policy content: ${err instanceof Error ? err.message : String(err)}`
        );
        setLoading(false);
      }
    };

    loadPolicy();
  }, [policyPath]);

  return {
    policyMeta: policyMeta ?? {
      title: defaultTitle,
      path: filePathToPolicyPath(policyPath),
      slug: filePathToPolicyPath(policyPath).split("/").pop() || "",
      type: "policy",
    },
    compiledMDX,
    loading,
    error,
  };
}
