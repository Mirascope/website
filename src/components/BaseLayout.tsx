import React from "react";
import type { ReactNode } from "react";

interface BaseLayoutProps {
  leftSidebar: ReactNode;
  mainContent: ReactNode;
  rightSidebar?: ReactNode;
}

/**
 * BaseLayout - Core layout with configurable sidebars
 *
 * Provides a consistent layout structure with left sidebar, main content area,
 * and optional right sidebar. Used by both DocsLayout and DevLayout.
 */
const BaseLayout: React.FC<BaseLayoutProps> = ({ leftSidebar, mainContent, rightSidebar }) => {
  return (
    <div className="flex justify-center">
      <div className="mx-auto flex w-full max-w-7xl">
        {/* Left sidebar */}
        {leftSidebar}

        {/* Main content area */}
        {mainContent}

        {/* Right sidebar (optional) */}
        {rightSidebar || <div className="hidden w-56 flex-shrink-0 lg:block"></div>}
      </div>
    </div>
  );
};

export default BaseLayout;
