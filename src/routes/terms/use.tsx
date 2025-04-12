import { createFileRoute } from "@tanstack/react-router";
import PolicyPage from "@/components/PolicyPage";
import { usePolicy } from "@/lib/hooks/usePolicy";
import useSEO from "@/lib/hooks/useSEO";

export const Route = createFileRoute("/terms/use")({
  component: TermsOfUsePage,
});

function TermsOfUsePage() {
  const { policyMeta, compiledMDX, loading, error } = usePolicy(
    "/src/policies/terms/use.mdx",
    "TERMS OF USE"
  );

  // Apply SEO with frontmatter from MDX
  useSEO({
    title: policyMeta?.title || "Terms of Use",
    description:
      compiledMDX?.frontmatter?.description ||
      "Guidelines and rules for using the Mirascope website.",
    url: "/terms/use",
    type: "article",
  });

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
