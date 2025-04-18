import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import PolicyPage, { PolicyPageLoading, PolicyPageError } from "@/components/PolicyPage";
import useSEO from "@/lib/hooks/useSEO";
import { policyLoader } from "@/lib/content/loaders";
import type { PolicyContent } from "@/lib/content/policy";

export const Route = createFileRoute("/terms/use")({
  component: TermsOfUsePage,

  // Use the policy loader
  loader: () => policyLoader({ params: { policy: "use" } }),

  // Configure loading state
  pendingComponent: () => <PolicyPageLoading type="terms-use" />,

  // Configure error handling
  errorComponent: ({ error }) => (
    <PolicyPageError
      type="terms-use"
      error={error instanceof Error ? error.message : String(error)}
    />
  ),
});

function TermsOfUsePage() {
  // Access the loaded content directly
  const content = useLoaderData({ from: "/terms/use", structuralSharing: false }) as PolicyContent;

  // Apply SEO with frontmatter from MDX
  useSEO({
    title: content?.meta?.title || "Terms of Use",
    description:
      content?.mdx?.frontmatter?.description ||
      "Guidelines and rules for using the Mirascope website.",
    url: "/terms/use",
    type: "article",
  });

  return <PolicyPage content={content} type="terms-use" />;
}
