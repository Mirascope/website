import { createFileRoute } from "@tanstack/react-router";
import PolicyPage, { PolicyPageLoading, PolicyPageError } from "@/components/PolicyPage";
import { getPolicy } from "@/lib/content/policy";
import useSEO from "@/lib/hooks/useSEO";
import { Suspense } from "react";
import { createSuspenseResource } from "@/lib/hooks/useSuspense";

// Suspense-enabled content component
function TermsOfServiceContent() {
  const policyResource = createSuspenseResource(`policy:terms/service`, () =>
    getPolicy("terms/service")
  );
  const content = policyResource.read();

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

export const Route = createFileRoute("/terms/service")({
  component: TermsOfServicePage,
});

function TermsOfServicePage() {
  try {
    return (
      <Suspense fallback={<PolicyPageLoading type="terms-service" />}>
        <TermsOfServiceContent />
      </Suspense>
    );
  } catch (error) {
    return (
      <PolicyPageError
        type="terms-service"
        error={error instanceof Error ? error.message : String(error)}
      />
    );
  }
}
