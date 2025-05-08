import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { Logo } from "@/src/components/core/branding";
import { cn } from "@/src/lib/utils";
import {
  useProvider,
  type Provider,
  providers,
  providerDefaults,
} from "@/src/components/core/providers/ProviderContext";

/**
 * A tabbed section component that creates tabs for each provider
 * and integrates with the provider context for selection state
 */
export function ProviderTabbedSection({
  children,
  className = "",
  showLogo = false,
}: {
  children: React.ReactNode;
  className?: string;
  showLogo?: boolean;
}) {
  const { provider, setProvider } = useProvider();
  const [activeProvider, setActiveProvider] = useState<Provider>(provider);
  const tabsListRef = useRef<HTMLDivElement>(null);

  // When the provider context changes, update the active provider
  useEffect(() => {
    setActiveProvider(provider);

    // Scroll the selected tab into view
    if (tabsListRef.current) {
      const selectedTab = tabsListRef.current.querySelector(`[data-state="active"]`);
      if (selectedTab) {
        const tabsList = tabsListRef.current;
        const tabsListRect = tabsList.getBoundingClientRect();
        const selectedTabRect = selectedTab.getBoundingClientRect();

        // Calculate the distance to scroll
        const scrollLeft =
          selectedTabRect.left -
          tabsListRect.left +
          tabsList.scrollLeft -
          tabsListRect.width / 2 +
          selectedTabRect.width / 2;

        tabsList.scrollTo({
          left: scrollLeft,
          behavior: "smooth",
        });
      }
    }
  }, [provider]);

  // Handle tab change
  const handleProviderChange = (value: string) => {
    const newProvider = value as Provider;
    setProvider(newProvider);
  };

  return (
    <div
      className={cn(
        "bg-card overflow-hidden rounded-md border-1 px-2 pt-2 pb-0 shadow-md",
        className
      )}
    >
      {showLogo && (
        <div className="flex items-center px-2 pb-2">
          <Logo size="micro" withText={true} />
        </div>
      )}

      <Tabs value={activeProvider} onValueChange={handleProviderChange} className="w-full">
        <div className="mb-2 px-1">
          <div ref={tabsListRef} className="hide-scrollbar overflow-x-auto pb-2">
            <TabsList className="inline-flex h-auto flex-nowrap gap-x-2 bg-transparent p-0">
              {providers.map((p) => (
                <TabsTrigger key={p} value={p} className="whitespace-nowrap">
                  {providerDefaults[p].displayName}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </div>

        {providers.map((p) => (
          <TabsContent key={p} value={p} className="m-0 p-0">
            {children}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
