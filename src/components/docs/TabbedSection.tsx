import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import Logo from "../Logo";
import { cn } from "@/lib/utils";

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
      <div className="p-4 border-2 border-red-500 rounded-md">
        No valid tabs found. Please use Tab components with value props.
      </div>
    );
  }

  return (
    <div className={cn("rounded-md bg-button-primary shadow-md overflow-hidden", className)}>
      {showLogo && (
        <div className="px-4 py-2.5 flex items-center">
          <Logo size="micro" withText={true} textClassName="text-white opacity-90 font-medium" />
        </div>
      )}

      <Tabs defaultValue={defaultTab} className="w-full">
        <div className="flex p-2">
          <TabsList className="bg-transparent p-0 h-auto">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200 rounded-sm border-1 border-transparent data-[state=active]:border-white data-[state=active]:text-white data-[state=active]:bg-transparent"
              >
                {tab.value}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="p-0 m-0">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
