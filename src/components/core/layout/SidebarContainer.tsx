import React, { useState, useEffect } from "react";

interface SidebarContainerProps {
  children: React.ReactNode;
}

/**
 * SidebarContainer - Manages the responsive sidebar for any page type
 *
 * Handles sidebar state (expanded/collapsed) based on screen size and
 * provides toggle functionality. Accepts any content as children.
 */
const SidebarContainer: React.FC<SidebarContainerProps> = ({ children }) => {
  // Track if we're at a small screen breakpoint
  const [isSmallScreen, setIsSmallScreen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768; // md breakpoint is 768px in Tailwind
    }
    return false; // Default to large screen for SSR
  });

  // Sidebar expanded state - only collapsible at mobile/tablet breakpoint
  // Default to expanded on large screens and collapsed on small screens
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768; // Auto-collapsed on small screens
    }
    return true; // Default to expanded for SSR
  });

  // Update breakpoint state based on window resize
  useEffect(() => {
    const handleResize = () => {
      const smallScreen = window.innerWidth < 768;
      const wasSmallScreen = isSmallScreen;

      // Update small screen state
      setIsSmallScreen(smallScreen);

      if (!smallScreen) {
        // Auto-expand sidebar on large screens
        setSidebarExpanded(true);
      } else if (!wasSmallScreen && smallScreen) {
        // Auto-collapse when crossing from large to small screen
        setSidebarExpanded(false);
      }
    };

    // Initialize on first render
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, [isSmallScreen]);

  // Toggle sidebar expanded/collapsed (only used on small screens)
  const toggleSidebar = () => {
    if (isSmallScreen) {
      setSidebarExpanded(!sidebarExpanded);
    }
  };

  return (
    <div className={`flex flex-shrink-0 ${isSmallScreen ? "w-0" : "w-64"}`}>
      {/* Collapsed sidebar toggle button (show only when collapsed on small screens) */}
      {isSmallScreen && !sidebarExpanded && (
        <div className="fixed top-[calc(var(--header-height)+50px)] z-20">
          <button
            onClick={toggleSidebar}
            className="bg-background border-border hover:bg-muted flex h-6 w-6 items-center justify-center rounded border"
            aria-label="Expand sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="stroke-muted-foreground"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      )}

      {/* Sidebar content - Only render children when visible or on desktop */}
      <div
        className={`bg-background fixed top-[var(--header-height)] h-[calc(100vh-var(--header-height))] transition-transform duration-300 ease-in-out ${
          isSmallScreen ? "w-64" : "w-64"
        } ${
          sidebarExpanded
            ? "translate-x-0"
            : "translate-x-[-110%]" /* Move completely out of view */
        } z-50 overflow-hidden border-r`}
        style={{
          boxShadow:
            sidebarExpanded && isSmallScreen
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
              : "none",
        }}
        aria-hidden={!sidebarExpanded}
      >
        {/* Expanded sidebar toggle button (show only on small screens when expanded) */}
        {isSmallScreen && sidebarExpanded && (
          <div className="absolute top-12 right-2 z-20">
            <button
              onClick={toggleSidebar}
              className="border-border hover:bg-muted flex h-6 w-6 items-center justify-center rounded border"
              aria-label="Collapse sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="stroke-muted-foreground"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </div>
        )}

        <div className="h-full overflow-y-auto">
          {/* Only render sidebar content when expanded on mobile or always on desktop */}
          {(sidebarExpanded || !isSmallScreen) && children}
        </div>
      </div>
    </div>
  );
};

export default SidebarContainer;
