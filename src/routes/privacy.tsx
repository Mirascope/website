import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import PolicyPage, { PolicyPageLoading, PolicyPageError } from "@/components/PolicyPage";
import useSEO from "@/lib/hooks/useSEO";
import { policyLoader } from "@/lib/content/loaders";
import type { PolicyContent } from "@/lib/content/policy";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,

  // Use the policy loader
  loader: () => policyLoader({ params: { slug: "privacy" } }),

  // Configure loading state
  pendingComponent: () => <PolicyPageLoading type="privacy" />,

  // Configure error handling
  errorComponent: ({ error }) => (
    <PolicyPageError
      type="privacy"
      error={error instanceof Error ? error.message : String(error)}
    />
  ),
});

function PrivacyPage() {
  // Access the loaded content directly
  const content = useLoaderData({ from: "/privacy", structuralSharing: false }) as PolicyContent;

  // Apply SEO with frontmatter from MDX
  useSEO({
    title: content?.meta?.title || "Privacy Policy",
    description:
      content?.mdx?.frontmatter?.description ||
      "How Mirascope collects, uses, and protects your personal information.",
    url: "/privacy",
    type: "article",
  });

  return <PolicyPage content={content} type="privacy" />;
}
