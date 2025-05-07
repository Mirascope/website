import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { Logo } from "@/src/components/core/branding";
import { cn } from "@/src/lib/utils";

/**
 * A Tab component to be used within TabbedSection
 * This is just a container for the content that will be extracted for tabs
 */
export function Tab({
  children,
  value: _, // Used by parent component
}: {
  children: React.ReactNode;
  value: string;
}) {
  return <>{children}</>;
}

// Set displayName for easier component identification in MDX
Tab.displayName = "Tab";

/**
 * A reusable component for tabbed content
 * Provides a consistent UI for different content in tabs
 */
export function TabbedSection({
  children,
  className = "",
  showLogo = false,
  defaultTab,
}: {
  children: React.ReactNode;
  className?: string;
  showLogo?: boolean;
  defaultTab?: string;
}) {
  // Extract tabs and their content
  const tabs: { value: string; content: React.ReactNode }[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const childType = child.type as any;
      const childProps = child.props as any;

      if (
        (childType === Tab || childType?.displayName === "Tab" || childType === "Tab") &&
        childProps.value
      ) {
        tabs.push({
          value: childProps.value,
          content: childProps.children,
        });
      }
    }
  });

  // Set the default tab (first tab if not specified)
  const firstTabValue = tabs.length > 0 ? tabs[0].value : "";
  defaultTab = defaultTab || firstTabValue;

  if (tabs.length === 0) {
    return (
      <div className="border-destructive rounded-md border-2 p-4">
        No valid tabs found. Please use Tab components with value props.
      </div>
    );
  }

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

      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="flex px-1">
          <TabsList className="h-auto gap-x-2 bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.value}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="m-0 p-0">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
