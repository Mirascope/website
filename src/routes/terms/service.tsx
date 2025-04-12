import { createFileRoute } from "@tanstack/react-router";
import PolicyPage from "@/components/PolicyPage";
import { usePolicy } from "@/lib/hooks/usePolicy";
import useSEO from "@/lib/hooks/useSEO";

export const Route = createFileRoute("/terms/service")({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  const { policyMeta, compiledMDX, loading, error } = usePolicy(
    "/src/policies/terms/service.mdx",
    "TERMS OF SERVICE"
  );

  // Apply SEO with frontmatter from MDX
  useSEO({
    title: policyMeta?.title || "Terms of Service",
    description:
      compiledMDX?.frontmatter?.description ||
      "Legal terms governing your use of Mirascope's platform and services.",
    url: "/terms/service",
    type: "article",
  });

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
