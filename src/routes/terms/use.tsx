import { createFileRoute } from "@tanstack/react-router";
import PolicyPage from "@/components/PolicyPage";
import { usePolicy } from "@/lib/hooks/usePolicy";

export const Route = createFileRoute("/terms/use")({
  component: TermsOfUsePage,
});

function TermsOfUsePage() {
  const { policyMeta, compiledMDX, loading, error } = usePolicy(
    "/src/policies/terms/use.mdx",
    "TERMS OF USE"
  );

  return (
    <PolicyPage
      meta={policyMeta}
      compiledMDX={compiledMDX}
      loading={loading}
      error={error}
      type="terms-use"
    />
  );
}
