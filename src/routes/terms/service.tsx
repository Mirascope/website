import { createFileRoute } from "@tanstack/react-router";
import PolicyPage from "@/components/PolicyPage";
import { usePolicy } from "@/lib/hooks/usePolicy";

export const Route = createFileRoute("/terms/service")({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  const { policyMeta, compiledMDX, loading, error } = usePolicy(
    "/src/policies/terms/service.mdx",
    "TERMS OF SERVICE"
  );
  
  return (
    <PolicyPage
      meta={policyMeta}
      compiledMDX={compiledMDX}
      loading={loading}
      error={error}
      type="terms-service"
    />
  );
}
