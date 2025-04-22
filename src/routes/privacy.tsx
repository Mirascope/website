import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import PolicyPage, { PolicyPageLoading, PolicyPageError } from "@/src/components/PolicyPage";
import SEOHelmet from "@/src/components/SEOHelmet";
import { policyLoader } from "@/src/lib/content/loaders";
import type { PolicyContent } from "@/src/lib/content/policy";
import { environment } from "@/src/lib/content/environment";

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
  onError: (error: Error) => environment.onError(error),
});

function PrivacyPage() {
  // Access the loaded content directly
  const content = useLoaderData({ from: "/privacy", structuralSharing: false }) as PolicyContent;

  return (
    <>
      <SEOHelmet
        title={content?.meta?.title || "Privacy Policy"}
        description={
          content?.mdx?.frontmatter?.description ||
          "How Mirascope collects, uses, and protects your personal information."
        }
        url="/privacy"
        type="article"
      />
      <PolicyPage content={content} type="privacy" />
    </>
  );
}
