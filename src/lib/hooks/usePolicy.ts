import { useState, useEffect } from "react";
import { fetchPolicyContent, type PolicyMeta } from "@/lib/policy-utils";

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
        // Fetch and process the policy content
        const { meta, compiledMDX } = await fetchPolicyContent(policyPath);
        setPolicyMeta(meta);
        setCompiledMDX(compiledMDX);
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
    error
  };
}