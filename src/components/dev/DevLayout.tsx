import React from "react";
import BaseLayout from "@/components/BaseLayout";
import DevSidebar from "./DevSidebar";

interface DevLayoutProps {
  children: React.ReactNode;
}

/**
 * DevLayout - Layout component for developer tools section
 *
 * Provides a consistent layout for all dev tool pages
 */
const DevLayout: React.FC<DevLayoutProps> = ({ children }) => {
  // Sidebar content
  const leftSidebar = <DevSidebar />;

  // Main content
  const mainContent = <div className="flex-1 min-w-0 px-8">{children}</div>;

  // Empty right sidebar
  const rightSidebar = <div className="w-56 flex-shrink-0 hidden lg:block"></div>;

  return (
    <BaseLayout leftSidebar={leftSidebar} mainContent={mainContent} rightSidebar={rightSidebar} />
  );
};

export default DevLayout;
