import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import PolicyPage, { PolicyPageLoading, PolicyPageError } from "@/components/PolicyPage";
import useSEO from "@/lib/hooks/useSEO";
import { policyLoader } from "@/lib/content/loaders";
import type { PolicyContent } from "@/lib/content/policy";

export const Route = createFileRoute("/terms/service")({
  component: TermsOfServicePage,

  // Use the policy loader
  loader: () => policyLoader({ params: { policy: "service" } }),

  // Configure loading state
  pendingComponent: () => <PolicyPageLoading type="terms-service" />,

  // Configure error handling
  errorComponent: ({ error }) => (
    <PolicyPageError
      type="terms-service"
      error={error instanceof Error ? error.message : String(error)}
    />
  ),
});

function TermsOfServicePage() {
  // Access the loaded content directly
  const content = useLoaderData({
    from: "/terms/service",
    structuralSharing: false,
  }) as PolicyContent;

  // Apply SEO with frontmatter from MDX
  useSEO({
    title: content?.meta?.title || "Terms of Service",
    description:
      content?.mdx?.frontmatter?.description ||
      "Legal terms governing your use of Mirascope's platform and services.",
    url: "/terms/service",
    type: "article",
  });

  return <PolicyPage content={content} type="terms-service" />;
}
