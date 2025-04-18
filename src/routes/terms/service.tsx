import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import PolicyPage, { PolicyPageLoading, PolicyPageError } from "@/components/PolicyPage";
import SEOHelmet from "@/components/SEOHelmet";
import { policyLoader } from "@/lib/content/loaders";
import type { PolicyContent } from "@/lib/content/policy";
import { environment } from "@/lib/content/environment";

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
  onError: (error: Error) => environment.onError(error),
});

function TermsOfServicePage() {
  // Access the loaded content directly
  const content = useLoaderData({
    from: "/terms/service",
    structuralSharing: false,
  }) as PolicyContent;

  return (
    <>
      <SEOHelmet
        title={content?.meta?.title || "Terms of Service"}
        description={
          content?.mdx?.frontmatter?.description ||
          "Legal terms governing your use of Mirascope's platform and services."
        }
        url="/terms/service"
        type="article"
      />
      <PolicyPage content={content} type="terms-service" />
    </>
  );
}
