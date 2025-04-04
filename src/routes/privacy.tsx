import { createFileRoute } from "@tanstack/react-router";
import PolicyPage from "@/components/PolicyPage";
import { usePolicy } from "@/lib/hooks/usePolicy";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { policyMeta, compiledMDX, loading, error } = usePolicy(
    "/src/policies/privacy.mdx",
    "PRIVACY POLICY"
  );
  
  return (
    <PolicyPage
      meta={policyMeta}
      compiledMDX={compiledMDX}
      loading={loading}
      error={error}
      type="privacy"
    />
  );
}
