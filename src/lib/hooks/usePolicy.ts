import { useState, useEffect } from "react";
import { fetchPolicyContent, type PolicyMeta } from "@/lib/policy-utils";
import { processMDX } from "@/lib/mdx-utils";

interface UsePolicyResult {
  policyMeta: PolicyMeta;
  compiledMDX: {
    code: string;
    frontmatter: Record<string, any>;
  } | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to fetch and process policy content
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
        // In development, fetch directly from the source file
        if (import.meta.env.DEV) {
          const { meta, compiledMDX } = await fetchPolicyContent(policyPath);
          setPolicyMeta(meta);
          setCompiledMDX(compiledMDX);
          setLoading(false);
          return;
        }

        // In production, use pre-processed static files
        // Example: "/src/policies/terms/use.mdx" -> "/static/policies/terms/use.mdx.json"
        const pathParts = policyPath.split("/");
        const fileName = pathParts[pathParts.length - 1];
        const dirPath = pathParts.slice(3, pathParts.length - 1).join("/");

        // Build the static path - note we need to use the full file name including .mdx
        const staticPath = `/static/policies/${dirPath}/${fileName}.json`;

        const response = await fetch(staticPath);
        if (!response.ok) {
          throw new Error(`Failed to fetch static policy: ${response.statusText}`);
        }

        const data = await response.json();
        const { content, frontmatter } = data;

        // Process the MDX content
        const processed = await processMDX(content);

        setPolicyMeta({
          title: frontmatter.title,
          lastUpdated: frontmatter.lastUpdated,
        });
        setCompiledMDX(processed);
        setLoading(false);
      } catch (err) {
        console.error(`Error loading policy from ${policyPath}:`, err);
        setError(
          `Failed to load policy content: ${err instanceof Error ? err.message : String(err)}`
        );
        setLoading(false);
      }
    };

    loadPolicy();
  }, [policyPath]);

  return {
    policyMeta: policyMeta ?? { title: defaultTitle },
    compiledMDX,
    loading,
    error,
  };
}
