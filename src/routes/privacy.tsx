import { createFileRoute } from "@tanstack/react-router";
import PolicyPage from "@/components/PolicyPage";
import { usePolicy } from "@/lib/content/policy";
import useSEO from "@/lib/hooks/useSEO";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { content, loading, error } = usePolicy("privacy");

  // Apply SEO with frontmatter from MDX
  useSEO({
    title: content?.meta?.title || "Privacy Policy",
    description:
      content?.mdx?.frontmatter?.description ||
      "How Mirascope collects, uses, and protects your personal information.",
    url: "/privacy",
    type: "article",
  });

  return <PolicyPage content={content} loading={loading} error={error} type="privacy" />;
}
