import { createFileRoute } from "@tanstack/react-router";
import PolicyPage from "@/components/PolicyPage";
import { usePolicy } from "@/lib/hooks/usePolicy";
import useSEO from "@/lib/hooks/useSEO";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { policyMeta, compiledMDX, loading, error } = usePolicy(
    "/src/policies/privacy.mdx",
    "PRIVACY POLICY"
  );

  // Apply SEO with frontmatter from MDX
  useSEO({
    title: policyMeta?.title || "Privacy Policy",
    description:
      compiledMDX?.frontmatter?.description ||
      "How Mirascope collects, uses, and protects your personal information.",
    url: "/privacy",
    type: "article",
  });

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
