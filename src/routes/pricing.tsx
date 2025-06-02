import { createFileRoute } from "@tanstack/react-router";
import { LilypadPricingPage } from "@/src/components/routes/LilypadPricingPage";
import { PageMeta } from "@/src/components";
import { environment } from "@/src/lib/content/environment";

function PricingPageWithMeta() {
  const marketingActions = {
    hosted: {
      free: {
        buttonText: "Get Started",
        buttonLink: "/docs/lilypad/",
        variant: "default" as const,
      },
      pro: {
        buttonText: "Contact Us",
        buttonLink: "mailto:sales@mirascope.com",
        variant: "outline" as const,
      },
      team: {
        buttonText: "Contact Us",
        buttonLink: "mailto:sales@mirascope.com",
        variant: "outline" as const,
      },
    },
    selfHosted: {
      free: {
        buttonText: "Get Started",
        buttonLink: "/docs/lilypad/getting-started/self-hosting",
        variant: "default" as const,
      },
      pro: {
        buttonText: "Request License",
        buttonLink: "mailto:sales@mirascope.com",
        variant: "outline" as const,
      },
      team: {
        buttonText: "Request License",
        buttonLink: "mailto:sales@mirascope.com",
        variant: "outline" as const,
      },
    },
  };

  return (
    <>
      <PageMeta
        title="Lilypad Pricing"
        description="Lilypad's pricing plans and features"
        product="lilypad"
      />
      <LilypadPricingPage actions={marketingActions} />
    </>
  );
}

export const Route = createFileRoute("/pricing")({
  component: PricingPageWithMeta,
  onError: (error: Error) => environment.onError(error),
});
