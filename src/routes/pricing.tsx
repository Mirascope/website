import { createFileRoute } from "@tanstack/react-router";
import { Check, Info, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/src/components/ui/tooltip";
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
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-border items-center min-h-[48px]">
      <div className="text-lg font-medium text-foreground">{feature}</div>

      {sameNonBoolean ? (
        <div className="col-span-2 text-center text-lg whitespace-pre-line">{free}</div>
      ) : (
        <>
          <div className="text-center">
            {typeof free === "boolean" ? (
              <div className="flex justify-center">
                {free ? (
                  <div className="rounded-full p-1 bg-primary/30">
                    <Check size={16} className="text-primary" />
                  </div>
                ) : (
                  <div className="rounded-full p-1 bg-muted">
                    <X size={16} className="text-muted-foreground" />
                  </div>
                )}
              </div>
            ) : (
              <span className="text-lg whitespace-pre-line text-foreground">{free}</span>
            )}
          </div>

          <div className="text-center">
            {typeof pro === "boolean" ? (
              <div className="flex justify-center">
                {pro ? (
                  <div className="rounded-full p-1 bg-primary/30">
                    <Check size={16} className="text-primary" />
                  </div>
                ) : (
                  <div className="rounded-full p-1 bg-muted">
                    <X size={16} className="text-muted-foreground" />
                  </div>
                )}
              </div>
            ) : (
              <span className="text-lg whitespace-pre-line text-foreground">{pro}</span>
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
  isGreen = false,
}: {
  name: string;
  price: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  isGreen?: boolean;
}) => (
  <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
    <div
      className={cn(
        "px-6 py-8",
        isGreen ? "bg-gradient-to-br from-primary/10 to-background" : "bg-background"
      )}
    >
      <h3
        className={cn("text-xl font-semibold mb-2", isGreen ? "text-primary" : "text-foreground")}
      >
        {name}
      </h3>
      <p className="text-muted-foreground mb-5">{description}</p>
      <div className="mb-6">
        <span className="text-3xl font-bold text-foreground">{price}</span>
        {price !== "TBD" && price !== "N/A" && (
          <span className="text-sm text-muted-foreground ml-1">/ month</span>
        )}
      </div>
      <a
        href={buttonLink}
        className={cn(
          "block w-full py-2 px-4 rounded-md text-center transition-colors",
          isGreen
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground hover:bg-accent"
        )}
      >
        {buttonText}
      </a>
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
      <h3 className="text-lg font-semibold text-primary mb-2">Open Beta Notice</h3>
      <p className="text-lg mb-2">
        Lilypad is currently in an open beta, during which we will not be charging for the platform.
        All users during this period will have free access to Pro features.
      </p>
      <p className="text-lg mb-2">
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
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4 text-center text-foreground">Lilypad Pricing</h1>
            <p className="text-xl text-foreground max-w-2xl mx-auto mb-2">
              Get started with the Free plan today.
            </p>
            <p className="text-md text-muted-foreground max-w-2xl mx-auto italic">
              No credit card required.
            </p>
          </div>

          {/* Shadcn Tabs */}
          <Tabs defaultValue="hosted" className="w-full mb-10">
            <div className="flex justify-center mb-8">
              <TabsList>
                <TabsTrigger value="hosted">Hosted By Us</TabsTrigger>
                <TabsTrigger value="selfhosted">Self Hosting</TabsTrigger>
              </TabsList>
            </div>

            {/* Hosted By Us Tab Content */}
            <TabsContent value="hosted">
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <PricingTier
                  name="Free"
                  price="$0"
                  description="For individuals just getting started"
                  buttonText="Get Started"
                  buttonLink="/docs/lilypad/"
                  isGreen={true}
                />
                <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-8 bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-foreground">Pro</h3>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info size={16} className="text-primary cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="w-md p-4 bg-primary/10 text-primary border border-primary/20"
                        >
                          {betaNoticeContent}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-muted-foreground mb-5">For teams with more advanced needs</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold">TBD</span>
                    </div>
                    <a
                      href="/docs/lilypad/"
                      className="block w-full py-2 px-4 rounded-md text-center transition-colors bg-muted text-muted-foreground hover:bg-accent"
                    >
                      *Get Started
                    </a>
                  </div>
                </div>
              </div>

              {/* Feature comparison table */}
              <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-accent border-b border-border">
                  <h3 className="text-lg font-medium text-foreground">Feature Comparison</h3>
                </div>
                <div className="px-4 py-5 sm:p-6 overflow-x-auto bg-background">
                  {/* Table header */}
                  <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border">
                    <div className="text-lg font-medium text-muted-foreground">Feature</div>
                    <div className="text-lg font-medium text-muted-foreground text-center">
                      Free
                    </div>
                    <div className="text-lg font-medium text-muted-foreground text-center">Pro</div>
                  </div>

                  {/* Table rows */}
                  {cloudHostedFeatures.map((feat, i) => (
                    <FeatureRow key={i} feature={feat.feature} free={feat.free} pro={feat.pro} />
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Self Hosting Tab Content */}
            <TabsContent value="selfhosted">
              <div className="grid md:grid-cols-2 gap-8 mb-10">
                <PricingTier
                  name="Free"
                  price="$0"
                  description="For individuals just getting started"
                  buttonText="Get Started"
                  buttonLink="/docs/lilypad/self-hosting"
                  isGreen={true}
                />
                <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-8">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-semibold text-foreground">Pro</h3>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info size={16} className="text-primary cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          className="w-96 p-4 bg-primary/10 text-primary border border-primary/20"
                        >
                          {betaNoticeContent}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-muted-foreground mb-5">For teams with more advanced needs</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold">TBD</span>
                    </div>
                    <a
                      href="mailto:sales@mirascope.com"
                      className="block w-full py-2 px-4 rounded-md text-center transition-colors bg-muted text-muted-foreground hover:bg-accent"
                    >
                      Request License
                    </a>
                  </div>
                </div>
              </div>

              {/* Feature comparison table */}
              <div className="bg-background border border-border rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-muted border-b border-border">
                  <h3 className="text-lg font-medium text-foreground">Feature Comparison</h3>
                </div>
                <div className="px-4 py-5 sm:p-6 overflow-x-auto bg-background">
                  {/* Table header */}
                  <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border">
                    <div className="text-lg font-medium text-muted-foreground">Feature</div>
                    <div className="text-lg font-medium text-muted-foreground text-center">
                      Free
                    </div>
                    <div className="text-lg font-medium text-muted-foreground text-center">Pro</div>
                  </div>

                  {/* Table rows */}
                  {selfHostedFeatures.map((feat, i) => (
                    <FeatureRow key={i} feature={feat.feature} free={feat.free} pro={feat.pro} />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* FAQ Section */}
          <div className="mt-16 bg-card p-8 rounded-lg border border-border">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">
                  How long will the open beta last?
                </h3>
                <p className="text-muted-foreground">
                  The open beta period is ongoing, and we'll provide advance notice before moving to
                  paid plans.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">
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
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              Have questions about our pricing?
            </h2>
            <p className="text-muted-foreground">
              Join our{" "}
              <a
                href="https://join.slack.com/t/mirascope-community/shared_invite/zt-2ilqhvmki-FB6LWluInUCkkjYD3oSjNA"
                className="text-primary font-medium hover:underline"
              >
                community
              </a>{" "}
              and ask the team directly!
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
