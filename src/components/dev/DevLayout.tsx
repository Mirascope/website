import React from "react";
import DevSidebar from "./DevSidebar";
import type { DevMeta } from "@/src/lib/content";

interface DevLayoutProps {
  children: React.ReactNode;
  devPages: DevMeta[];
}

/**
 * DevLayout - Layout component for developer tools section
 *
 * Provides a consistent layout for all dev tool pages without the 60px top padding
 * that's present in the main BaseLayout component
 */
const DevLayout: React.FC<DevLayoutProps> = ({ children, devPages }) => {
  // Sidebar content
  const leftSidebar = <DevSidebar devPages={devPages} />;

  // Main content - expanded to use full width
  const mainContent = <div className="min-w-0 flex-1 px-8">{children}</div>;

  return (
    <div className="flex justify-center pt-0">
      <div className="mx-auto flex w-full max-w-7xl">
        {/* Left sidebar */}
        {leftSidebar}

        {/* Main content area */}
        {mainContent}
      </div>
    </div>
  );
};

export default DevLayout;
