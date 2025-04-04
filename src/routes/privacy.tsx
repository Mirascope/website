import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import PolicyPage from "@/components/PolicyPage";
import { fetchPolicyContent, type PolicyMeta } from "@/lib/policy-utils";
export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  // State for terms content and loading state
  const [policyMeta, setPolicyMeta] = useState<PolicyMeta | null>(null);
  const [compiledMDX, setCompiledMDX] = useState<{
    code: string;
    frontmatter: Record<string, any>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTerms = async () => {
      try {
        // Fetch and process the terms of use
        const { meta, compiledMDX } = await fetchPolicyContent("/src/policies/privacy.mdx");
        setPolicyMeta(meta);
        setCompiledMDX(compiledMDX);
        setLoading(false);
      } catch (err) {
        console.error("Error loading terms of use:", err);
        setError(
          `Failed to load terms of use: ${err instanceof Error ? err.message : String(err)}`
        );
        setLoading(false);
      }
    };

    loadTerms();
  }, []);

  return (
    <PolicyPage
      meta={policyMeta || { title: "PRIVACY POLICY" }}
      compiledMDX={compiledMDX}
      loading={loading}
      error={error}
      type="privacy"
    />
  );
}
