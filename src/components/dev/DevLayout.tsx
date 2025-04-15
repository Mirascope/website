import React from "react";
import DevSidebar from "./DevSidebar";

interface DevLayoutProps {
  children: React.ReactNode;
}

/**
 * DevLayout - Layout component for developer tools section
 *
 * Provides a consistent layout for all dev tool pages without the 60px top padding
 * that's present in the main BaseLayout component
 */
const DevLayout: React.FC<DevLayoutProps> = ({ children }) => {
  // Sidebar content
  const leftSidebar = <DevSidebar />;

  // Main content
  const mainContent = <div className="flex-1 min-w-0 px-8">{children}</div>;

  // Empty right sidebar
  const rightSidebar = <div className="w-56 flex-shrink-0 hidden lg:block"></div>;

  return (
    <div className="flex justify-center pt-0">
      <div className="flex mx-auto w-full max-w-7xl">
        {/* Left sidebar */}
        {leftSidebar}

        {/* Main content area */}
        {mainContent}

        {/* Right sidebar */}
        {rightSidebar}
      </div>
    </div>
  );
};

export default DevLayout;
