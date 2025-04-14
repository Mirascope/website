import { createFileRoute } from "@tanstack/react-router";
import PolicyPage from "@/components/PolicyPage";
import { usePolicy } from "@/lib/content/policy";
import useSEO from "@/lib/hooks/useSEO";

export const Route = createFileRoute("/terms/service")({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  const { content, loading, error } = usePolicy("terms/service");

  // Apply SEO with frontmatter from MDX
  useSEO({
    title: content?.meta?.title || "Terms of Service",
    description:
      content?.mdx?.frontmatter?.description ||
      "Legal terms governing your use of Mirascope's platform and services.",
    url: "/terms/service",
    type: "article",
  });

  return <PolicyPage content={content} loading={loading} error={error} type="terms-service" />;
}
