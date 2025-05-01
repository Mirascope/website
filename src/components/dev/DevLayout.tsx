import React from "react";
import DevSidebar from "./DevSidebar";
import BaseLayout from "@/src/components/BaseLayout";
import SidebarContainer from "@/src/components/SidebarContainer";
import type { DevMeta } from "@/src/lib/content";

interface DevLayoutProps {
  children: React.ReactNode;
  devPages: DevMeta[];
}

/**
 * DevLayout - Layout component for developer tools section
 *
 * Provides a consistent layout for all dev tool pages with responsive sidebar
 */
const DevLayout: React.FC<DevLayoutProps> = ({ children, devPages }) => {
  // Sidebar content with responsive container
  const leftSidebar = (
    <SidebarContainer>
      <DevSidebar devPages={devPages} />
    </SidebarContainer>
  );

  // Main content - add max-width constraint to prevent pushing sidebar
  const mainContent = <div className="max-w-5xl min-w-0 flex-1 px-8">{children}</div>;

  return <BaseLayout leftSidebar={leftSidebar} mainContent={mainContent} />;
};

export default DevLayout;
