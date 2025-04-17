import { createFileRoute } from "@tanstack/react-router";
import PolicyPage, { PolicyPageLoading, PolicyPageError } from "@/components/PolicyPage";
import { getPolicy } from "@/lib/content/policy";
import useSEO from "@/lib/hooks/useSEO";
import { Suspense } from "react";
import { createSuspenseResource } from "@/lib/hooks/useSuspense";

// Suspense-enabled content component
function PrivacyContent() {
  const policyResource = createSuspenseResource(`policy:privacy`, () => getPolicy("privacy"));
  const content = policyResource.read();

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

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  try {
    return (
      <Suspense fallback={<PolicyPageLoading type="privacy" />}>
        <PrivacyContent />
      </Suspense>
    );
  } catch (error) {
    return (
      <PolicyPageError
        type="privacy"
        error={error instanceof Error ? error.message : String(error)}
      />
    );
  }
}
