import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { ButtonLink } from "@/src/components/ui/button-link";
import { cn } from "@/src/lib/utils";
import { PageMeta } from "@/src/components";
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
  team,
}: {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  team: string | boolean;
}) => {
  // If all tiers have the exact same value (and it's not a boolean)
  const allSameNonBoolean = free === pro && pro === team && typeof free === "string" && free !== "";

  return (
    <div className="border-border grid min-h-[48px] grid-cols-4 items-center gap-4 border-b py-3">
      <div className="text-foreground text-lg font-medium">{feature}</div>

      {allSameNonBoolean ? (
        <div className="col-span-3 text-center text-lg whitespace-pre-line">{free}</div>
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

          <div className="text-center">
            {typeof team === "boolean" ? (
              <div className="flex justify-center">
                {team ? (
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
              <span className="text-foreground text-lg whitespace-pre-line">{team}</span>
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
  badge,
  variant = "default",
}: {
  name: string;
  price: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  badge?: "Open Beta" | "Closed Beta";
  variant?: "default" | "outline";
}) => (
  <div className="bg-background border-border overflow-hidden rounded-lg border shadow-sm">
    <div className={cn("bg-background px-6 py-8")}>
      <div className="mb-2 flex items-center gap-2">
        <h3 className={cn("text-foreground text-xl font-semibold")}>{name}</h3>
        {badge && (
          <span
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium",
              badge === "Open Beta"
                ? "bg-primary/20 text-primary"
                : "bg-muted text-muted-foreground"
            )}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="text-muted-foreground mb-5">{description}</p>
      <div className="mb-6">
        <span className="text-foreground text-3xl font-bold">{price}</span>
        {price !== "TBD" && price !== "N/A" && (
          <span className="text-muted-foreground ml-1 text-sm">/ month</span>
        )}
      </div>
      <ButtonLink href={buttonLink} className="w-full" variant={variant}>
        {buttonText}
      </ButtonLink>
    </div>
  </div>
);

// Feature comparison table component
const FeatureComparisonTable = ({
  features,
}: {
  features: Array<{
    feature: string;
    free: string | boolean;
    pro: string | boolean;
    team: string | boolean;
  }>;
}) => (
  <div className="bg-background border-border overflow-hidden rounded-lg border shadow-sm">
    <div className="bg-accent border-border border-b px-4 py-5 sm:px-6">
      <h3 className="text-accent-foreground text-lg font-medium">Feature Comparison</h3>
    </div>
    <div className="bg-background overflow-x-auto px-4 py-5 sm:p-6">
      {/* Table header */}
      <div className="border-border grid grid-cols-4 gap-4 border-b pb-4">
        <div className="text-muted-foreground text-lg font-medium">Feature</div>
        <div className="text-muted-foreground text-center text-lg font-medium">Free</div>
        <div className="text-muted-foreground text-center text-lg font-medium">Pro</div>
        <div className="text-muted-foreground text-center text-lg font-medium">Team</div>
      </div>

      {/* Table rows */}
      {features.map((feat, i) => (
        <FeatureRow
          key={i}
          feature={feat.feature}
          free={feat.free}
          pro={feat.pro}
          team={feat.team}
        />
      ))}
    </div>
  </div>
);

function PricingPage() {
  // Cloud hosted features
  const cloudHostedFeatures = [
    { feature: "Projects", free: "Unlimited", pro: "Unlimited", team: "Unlimited" },
    { feature: "Users", free: "2", pro: "10", team: "Unlimited" },
    {
      feature: "Tracing",
      free: "30k spans / month",
      pro: "100k spans / month (thereafter $1 per 10k)",
      team: "1M spans / month (thereafter $1 per 10k)",
    },
    { feature: "Data Retention", free: "30 days", pro: "90 days", team: "180 days" },
    { feature: "Versioned Functions", free: true, pro: true, team: true },
    { feature: "Playground", free: true, pro: true, team: true },
    { feature: "Comparisons", free: true, pro: true, team: true },
    { feature: "Annotations", free: true, pro: true, team: true },
    { feature: "Support (Community)", free: true, pro: true, team: true },
    { feature: "Support (Chat / Email)", free: false, pro: true, team: true },
    { feature: "Support (Private Slack)", free: false, pro: false, team: true },
    { feature: "API Rate Limits", free: "10 / minute", pro: "100 / minute", team: "1000 / minute" },
  ];

  // Self-hosted features
  const selfHostedFeatures = [
    { feature: "Projects", free: "Unlimited", pro: "Unlimited", team: "Unlimited" },
    { feature: "Users", free: "Unlimited", pro: "As licensed", team: "As licensed" },
    { feature: "Tracing", free: "No limits", pro: "No limits", team: "No limits" },
    { feature: "Data Retention", free: "No limits", pro: "No limits", team: "No limits" },
    { feature: "Versioned Functions", free: true, pro: true, team: true },
    { feature: "Playground", free: false, pro: true, team: true },
    { feature: "Comparisons", free: false, pro: true, team: true },
    { feature: "Annotations", free: false, pro: true, team: true },
    { feature: "Support (Community)", free: true, pro: true, team: true },
    { feature: "Support (Chat / Email)", free: false, pro: true, team: true },
    { feature: "Support (Private Slack)", free: false, pro: false, team: true },
    { feature: "API Rate Limits", free: "No limits", pro: "No limits", team: "No limits" },
  ];

  return (
    <>
      <PageMeta
        title="Lilypad Pricing"
        description="Lilypad's pricing plans and features"
        product="lilypad"
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
              <TabsList className="bg-muted px-1 py-5">
                <TabsTrigger value="hosted">Hosted By Us</TabsTrigger>
                <TabsTrigger value="selfhosted">Self Hosting</TabsTrigger>
              </TabsList>
            </div>

            {/* Hosted By Us Tab Content */}
            <TabsContent value="hosted">
              <div className="mb-10 grid gap-8 md:grid-cols-3">
                <PricingTier
                  name="Free"
                  price="$0"
                  description="For individuals just getting started"
                  buttonText="Get Started"
                  buttonLink="/docs/lilypad/"
                  badge="Open Beta"
                />
                <PricingTier
                  name="Pro"
                  price="TBD"
                  description="For teams with more advanced needs"
                  buttonText="Contact Us"
                  buttonLink="mailto:sales@mirascope.com"
                  badge="Closed Beta"
                  variant="outline"
                />
                <PricingTier
                  name="Team"
                  price="TBD"
                  description="For larger teams requiring dedicated support"
                  buttonText="Contact Us"
                  buttonLink="mailto:sales@mirascope.com"
                  badge="Closed Beta"
                  variant="outline"
                />
              </div>

              {/* Feature comparison table */}
              <FeatureComparisonTable features={cloudHostedFeatures} />
            </TabsContent>

            {/* Self Hosting Tab Content */}
            <TabsContent value="selfhosted">
              <div className="mb-10 grid gap-8 md:grid-cols-3">
                <PricingTier
                  name="Free"
                  price="$0"
                  description="For individuals just getting started"
                  buttonText="Get Started"
                  buttonLink="/docs/lilypad/getting-started/self-hosting"
                  badge="Open Beta"
                />
                <PricingTier
                  name="Pro"
                  price="TBD"
                  description="For teams with more advanced needs"
                  buttonText="Request License"
                  buttonLink="mailto:sales@mirascope.com"
                  badge="Closed Beta"
                  variant="outline"
                />
                <PricingTier
                  name="Team"
                  price="TBD"
                  description="For larger teams requiring dedicated support"
                  buttonText="Request License"
                  buttonLink="mailto:sales@mirascope.com"
                  badge="Closed Beta"
                  variant="outline"
                />
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
