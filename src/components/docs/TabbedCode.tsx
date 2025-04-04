import React, { useState } from "react";
import { cn } from "@/lib/utils";
import Logo from "../Logo";

/**
 * A simple tabs component for MDX
 */
export function TabbedCode({
  children,
  mirascopeHeader = false,
  className = "",
}: {
  children: React.ReactNode;
  mirascopeHeader?: boolean;
  className?: string;
}) {
  // Parse the MDX string directly
  const content = children?.toString() || "";
  console.log("Raw content:", content);

  // Find all tab sections
  const tabs: { name: string; content: string }[] = [];

  // Very simple regex to extract tab sections
  const tabSections = content.split(/<CodeTab name="([^"]+)">([\s\S]*?)<\/CodeTab>/g);
  console.log("Tab sections:", tabSections);

  // Process the sections (every 3 items form a group: before match, name, content)
  for (let i = 1; i < tabSections.length; i += 3) {
    if (tabSections[i] && tabSections[i + 1]) {
      tabs.push({
        name: tabSections[i],
        content: tabSections[i + 1].trim(),
      });
    }
  }

  console.log("Found tabs:", tabs);

  // If no tabs, just render the children directly
  if (tabs.length === 0) {
    return (
      <div className="p-4 border-2 border-red-500 rounded-md">
        No tabs found. Raw content: {String(children).substring(0, 100)}...
      </div>
    );
  }

  // Simple tab implementation
  const [activeTab, setActiveTab] = useState(tabs[0].name);
  const activeContent = tabs.find((tab) => tab.name === activeTab)?.content || "";

  return (
    <div
      className={cn(
        "rounded-md border-2 border-blue-600/50 bg-[#191c20] shadow-md overflow-hidden",
        className
      )}
    >
      {mirascopeHeader && (
        <div className="px-4 py-2.5 flex items-center bg-blue-800/20">
          <Logo size="micro" withText={true} textClassName="text-white opacity-90 font-medium" />
        </div>
      )}

      <div className="flex border-b border-gray-700 px-3">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={cn(
              "px-4 py-1.5 text-sm text-gray-400 hover:text-gray-200 relative",
              tab.name === activeTab && "text-white border-b-2 border-white"
            )}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="p-4 overflow-auto">
        <pre>
          <code>{activeContent}</code>
        </pre>
      </div>
    </div>
  );
}

/**
 * Tab component - just a marker for the parser
 */
export function CodeTab({
  children,
  name: _, // Used by parent component, underscore to mark as intentionally unused
}: {
  children: React.ReactNode;
  name: string;
}) {
  return <>{children}</>;
}

CodeTab.displayName = "CodeTab";
