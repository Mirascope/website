import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import PolicyPage, { PolicyPageLoading, PolicyPageError } from "@/src/components/PolicyPage";
import SEOMeta from "@/src/components/SEOMeta";
import { createPolicyLoader } from "@/src/lib/content";
import type { PolicyContent } from "@/src/lib/content";
import { environment } from "@/src/lib/content/environment";

export const Route = createFileRoute("/terms/use")({
  component: TermsOfUsePage,

  // Use our inline policy loader
  loader: createPolicyLoader("/policy/terms/use"),

  // Configure loading state
  pendingComponent: () => <PolicyPageLoading type="terms-use" />,

  // Configure error handling
  errorComponent: ({ error }) => (
    <PolicyPageError
      type="terms-use"
      error={error instanceof Error ? error.message : String(error)}
    />
  ),

  onError: (error: Error) => environment.onError(error),
});

function TermsOfUsePage() {
  // Access the loaded content directly
  const content = useLoaderData({ from: "/terms/use", structuralSharing: false }) as PolicyContent;

  return (
    <>
      <SEOMeta
        title={content?.meta?.title || "Terms of Use"}
        description={
          content?.mdx?.frontmatter?.description ||
          "Guidelines and rules for using the Mirascope website."
        }
        url="/terms/use"
        type="article"
      />
      <PolicyPage content={content} type="terms-use" />
    </>
  );
}
