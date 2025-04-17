import { createFileRoute } from "@tanstack/react-router";
import PolicyPage, { PolicyPageLoading, PolicyPageError } from "@/components/PolicyPage";
import { getPolicy } from "@/lib/content/policy";
import useSEO from "@/lib/hooks/useSEO";
import { Suspense } from "react";
import { createSuspenseResource } from "@/lib/hooks/useSuspense";

// Suspense-enabled content component
function TermsOfUseContent() {
  const policyResource = createSuspenseResource(`policy:terms/use`, () => getPolicy("terms/use"));
  const content = policyResource.read();

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

export const Route = createFileRoute("/terms/use")({
  component: TermsOfUsePage,
});

function TermsOfUsePage() {
  try {
    return (
      <Suspense fallback={<PolicyPageLoading type="terms-use" />}>
        <TermsOfUseContent />
      </Suspense>
    );
  } catch (error) {
    return (
      <PolicyPageError
        type="terms-use"
        error={error instanceof Error ? error.message : String(error)}
      />
    );
  }
}
