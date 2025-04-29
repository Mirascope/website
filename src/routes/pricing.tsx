import { createFileRoute } from "@tanstack/react-router";
import { Check, Info, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/src/components/ui/tooltip";
import { ButtonLink } from "@/src/components/ui/button-link";
import { cn } from "@/src/lib/utils";
import SEOMeta from "@/src/components/SEOMeta";
import { environment } from "@/src/lib/content/environment";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  onError: (error: Error) => environment.onError(error),
});

// Feature row component for displaying features with the same value across tiers
const FeatureRow = ({
  feature,
  free,
  pro,
}: {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
}) => {
  // If both tiers have the exact same value (and it's not a boolean)
  const sameNonBoolean = free === pro && typeof free === "string" && free !== "";

  return (
    <div className="border-border grid min-h-[48px] grid-cols-3 items-center gap-4 border-b py-3">
      <div className="text-foreground text-lg font-medium">{feature}</div>

      {sameNonBoolean ? (
        <div className="col-span-2 text-center text-lg whitespace-pre-line">{free}</div>
      ) : (
        <>
          <div className="text-center">
            {typeof free === "boolean" ? (
              <div className="flex justify-center">
                {free ? (
                  <div className="bg-primary/30 rounded-full p-1">
                    <Check size={16} className="text-primary" />
                  </div>
                ) : (
                  <div className="bg-muted rounded-full p-1">
                    <X size={16} className="text-muted-foreground" />
                  </div>
                )}
              </div>
            ) : (
              <span className="text-foreground text-lg whitespace-pre-line">{free}</span>
            )}
          </div>

          <div className="text-center">
            {typeof pro === "boolean" ? (
              <div className="flex justify-center">
                {pro ? (
                  <div className="bg-primary/30 rounded-full p-1">
                    <Check size={16} className="text-primary" />
                  </div>
                ) : (
                  <div className="bg-muted rounded-full p-1">
                    <X size={16} className="text-muted-foreground" />
                  </div>
                )}
              </div>
            ) : (
              <span className="text-foreground text-lg whitespace-pre-line">{pro}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Pricing tier component
const PricingTier = ({
  name,
  price,
  description,
  buttonText,
  buttonLink,
}: {
  name: string;
  price: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}) => (
  <div className="bg-background border-border overflow-hidden rounded-lg border shadow-sm">
    <div className={cn("bg-background px-6 py-8")}>
      <h3 className={cn("text-foreground mb-2 text-xl font-semibold")}>{name}</h3>
      <p className="text-muted-foreground mb-5">{description}</p>
      <div className="mb-6">
        <span className="text-foreground text-3xl font-bold">{price}</span>
        {price !== "TBD" && price !== "N/A" && (
          <span className="text-muted-foreground ml-1 text-sm">/ month</span>
        )}
      </div>
      <ButtonLink href={buttonLink} className="w-full" variant="default">
        {buttonText}
      </ButtonLink>
    </div>
  </div>
);

// Feature comparison table component
const FeatureComparisonTable = ({
  features,
}: {
  features: Array<{ feature: string; free: string | boolean; pro: string | boolean }>;
}) => (
  <div className="bg-background border-border overflow-hidden rounded-lg border shadow-sm">
    <div className="bg-accent border-border border-b px-4 py-5 sm:px-6">
      <h3 className="text-foreground text-lg font-medium">Feature Comparison</h3>
    </div>
    <div className="bg-background overflow-x-auto px-4 py-5 sm:p-6">
      {/* Table header */}
      <div className="border-border grid grid-cols-3 gap-4 border-b pb-4">
        <div className="text-muted-foreground text-lg font-medium">Feature</div>
        <div className="text-muted-foreground text-center text-lg font-medium">Free</div>
        <div className="text-muted-foreground text-center text-lg font-medium">Pro</div>
      </div>

      {/* Table rows */}
      {features.map((feat, i) => (
        <FeatureRow key={i} feature={feat.feature} free={feat.free} pro={feat.pro} />
      ))}
    </div>
  </div>
);

function PricingPage() {
  // Cloud hosted features
  const cloudHostedFeatures = [
    { feature: "Projects", free: "Unlimited", pro: "Unlimited" },
    { feature: "Users", free: "1", pro: "5" },
    {
      feature: "Tracing",
      free: "30k spans / month",
      pro: "$0.0001 / span\n(first 100k free)",
    },
    { feature: "Data Retention", free: "30 days", pro: "90 days" },
    { feature: "Versioned Functions", free: true, pro: true },
    { feature: "Playground", free: true, pro: true },
    { feature: "Comparisons", free: true, pro: true },
    { feature: "Annotations", free: true, pro: true },
    { feature: "Support (Community)", free: true, pro: true },
    { feature: "Support (Chat / Email)", free: false, pro: true },
    { feature: "API Rate Limits", free: "10 / minute", pro: "100 / minute" },
  ];

  // Self-hosted features
  const selfHostedFeatures = [
    { feature: "Projects", free: "Unlimited", pro: "Unlimited" },
    { feature: "Users", free: "1", pro: "As licensed" },
    { feature: "Tracing", free: "No limits", pro: "No limits" },
    { feature: "Data Retention", free: "No limits", pro: "No limits" },
    { feature: "Versioned Functions", free: true, pro: true },
    { feature: "Playground", free: false, pro: true },
    { feature: "Comparisons", free: false, pro: true },
    { feature: "Annotations", free: false, pro: true },
    { feature: "Support (Community)", free: true, pro: true },
    { feature: "Support (Chat / Email)", free: false, pro: true },
    { feature: "API Rate Limits", free: "No limits", pro: "No limits" },
  ];

  // Beta notice content for tooltips
  const betaNoticeContent = (
    <div className="font-handwriting">
      <h3 className="text-primary mb-2 text-lg font-semibold">Open Beta Notice</h3>
      <p className="mb-2 text-lg">
        Lilypad is currently in an open beta, during which we will not be charging for the platform.
        All users during this period will have free access to Pro features.
      </p>
      <p className="mb-2 text-lg">
        Once we finalize our pricing and release the production stable version, we will give all
        existing users a grace period during which they can continue to evaluate the platform to
        determine if they would like to continue on a paid plan.
      </p>
      <p className="text-lg">
        Licenses for self-hosting are available upon request during the beta.
      </p>
    </div>
  );

  return (
    <>
      <SEOMeta
        title="Lilypad Pricing"
        description="Lilypad's pricing plans and features"
        product="lilypad"
        url="/pricing"
      />
      <div className="px-4 py-4">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 text-center">
            <h1 className="text-foreground mb-4 text-center text-4xl font-bold">Lilypad Pricing</h1>
            <p className="text-foreground mx-auto mb-2 max-w-2xl text-xl">
              Get started with the Free plan today.
            </p>
            <p className="text-muted-foreground mx-auto max-w-2xl text-sm italic">
              No credit card required.
            </p>
          </div>

          {/* Shadcn Tabs */}
          <Tabs defaultValue="hosted" className="mb-10 w-full">
            <div className="mb-8 flex justify-center">
              <TabsList>
                <TabsTrigger value="hosted">Hosted By Us</TabsTrigger>
                <TabsTrigger value="selfhosted">Self Hosting</TabsTrigger>
              </TabsList>
            </div>

            {/* Hosted By Us Tab Content */}
            <TabsContent value="hosted">
              <div className="mb-10 grid gap-8 md:grid-cols-2">
                <PricingTier
                  name="Free"
                  price="$0"
                  description="For individuals just getting started"
                  buttonText="Get Started"
                  buttonLink="/docs/lilypad/"
                />
                <div className="bg-background border-border overflow-hidden rounded-lg border shadow-sm">
                  <div className="bg-background px-6 py-8">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-foreground text-xl font-semibold">Pro</h3>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info size={16} className="text-primary cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="bg-popover text-primary border-primary/20 w-md border p-4"
                        >
                          {betaNoticeContent}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-muted-foreground mb-5">For teams with more advanced needs</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold">TBD</span>
                    </div>
                    <ButtonLink href="/docs/lilypad/" variant="outline" className="w-full">
                      *Get Started
                    </ButtonLink>
                  </div>
                </div>
              </div>

              {/* Feature comparison table */}
              <FeatureComparisonTable features={cloudHostedFeatures} />
            </TabsContent>

            {/* Self Hosting Tab Content */}
            <TabsContent value="selfhosted">
              <div className="mb-10 grid gap-8 md:grid-cols-2">
                <PricingTier
                  name="Free"
                  price="$0"
                  description="For individuals just getting started"
                  buttonText="Get Started"
                  buttonLink="/docs/lilypad/getting-started/self-hosting"
                />
                <div className="bg-background border-border overflow-hidden rounded-lg border shadow-sm">
                  <div className="px-6 py-8">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-foreground text-xl font-semibold">Pro</h3>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info size={16} className="text-primary cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="bg-primary/10 text-primary border-primary/20 w-96 border p-4"
                        >
                          {betaNoticeContent}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-muted-foreground mb-5">For teams with more advanced needs</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold">TBD</span>
                    </div>
                    <ButtonLink
                      href="mailto:sales@mirascope.com"
                      variant="outline"
                      className="w-full"
                    >
                      Request License
                    </ButtonLink>
                  </div>
                </div>
              </div>

              {/* Feature comparison table */}
              <FeatureComparisonTable features={selfHostedFeatures} />
            </TabsContent>
          </Tabs>

          {/* FAQ Section */}
          <div className="bg-card border-border mt-16 rounded-lg border p-8">
            <h2 className="text-foreground mb-4 text-2xl font-semibold">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-foreground mb-2 text-lg font-medium">
                  How long will the open beta last?
                </h3>
                <p className="text-muted-foreground">
                  The open beta period is ongoing, and we'll provide advance notice before moving to
                  paid plans.
                </p>
              </div>
              <div>
                <h3 className="text-foreground mb-2 text-lg font-medium">
                  What happens when the beta ends?
                </h3>
                <p className="text-muted-foreground">
                  All existing users will receive a grace period to evaluate which plan is right for
                  them before making any changes.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-foreground mb-4 text-2xl font-semibold">
              Have questions about our pricing?
            </h2>
            <p className="text-muted-foreground">
              Join our{" "}
              <ButtonLink
                href="https://join.slack.com/t/mirascope-community/shared_invite/zt-2ilqhvmki-FB6LWluInUCkkjYD3oSjNA"
                variant="link"
                className="h-auto p-0"
              >
                community
              </ButtonLink>{" "}
              and ask the team directly!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
