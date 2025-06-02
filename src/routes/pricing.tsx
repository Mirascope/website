import { createFileRoute } from "@tanstack/react-router";
import { LilypadPricingPage } from "@/src/components/routes/LilypadPricingPage";
import { PageMeta } from "@/src/components";
import { environment } from "@/src/lib/content/environment";

function PricingPageWithMeta() {
  return (
    <>
      <PageMeta
        title="Lilypad Pricing"
        description="Lilypad's pricing plans and features"
        product="lilypad"
      />
      <LilypadPricingPage />
    </>
  );
}

export const Route = createFileRoute("/pricing")({
  component: PricingPageWithMeta,
  onError: (error: Error) => environment.onError(error),
});
