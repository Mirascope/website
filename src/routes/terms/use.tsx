import { createFileRoute } from "@tanstack/react-router";
import PolicyPage from "@/components/PolicyPage";
import { usePolicy } from "@/lib/content/policy";
import useSEO from "@/lib/hooks/useSEO";

export const Route = createFileRoute("/terms/use")({
  component: TermsOfUsePage,
});

function TermsOfUsePage() {
  const { content, loading, error } = usePolicy("terms/use");

  // Apply SEO with frontmatter from MDX
  useSEO({
    title: content?.meta?.title || "Terms of Use",
    description:
      content?.mdx?.frontmatter?.description ||
      "Guidelines and rules for using the Mirascope website.",
    url: "/terms/use",
    type: "article",
  });

  return <PolicyPage content={content} loading={loading} error={error} type="terms-use" />;
}
