import React, { useState, useEffect } from "react";
import DocsSidebar from "@/components/docs/core/DocsSidebar";
import { type ProductName } from "@/lib/route-types";
import { type DocMeta } from "@/lib/docs";

interface SidebarContainerProps {
  product: ProductName;
  section: string | null;
  slug: string;
  group: string | null;
  docs: DocMeta[];
}

/**
 * SidebarContainer - Manages the responsive sidebar for documentation pages
 *
 * Handles sidebar state (expanded/collapsed) based on screen size and
 * provides toggle functionality
 */
const SidebarContainer: React.FC<SidebarContainerProps> = ({
  product,
  section,
  slug,
  group,
  docs,
}) => {
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
    <div
      className={`transition-all duration-300 ease-in-out flex flex-shrink-0 ${
        sidebarExpanded ? "w-64" : isSmallScreen ? "w-10" : "w-64"
      }`}
    >
      {/* Collapsed sidebar toggle button (show only when collapsed on small screens) */}
      {isSmallScreen && !sidebarExpanded && (
        <div className="fixed top-[110px] z-20">
          <button
            onClick={toggleSidebar}
            className="flex items-center rounded bg-white border border-gray-300 justify-center w-6 h-6 rounded hover:bg-gray-100"
            aria-label="Expand sidebar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="stroke-gray-300"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      )}

      {/* Sidebar content */}
      <div
        className={`fixed h-[calc(100vh-60px)] top-[60px] pt-6 transition-all duration-300 ease-in-out ${
          sidebarExpanded
            ? "w-64 opacity-100"
            : isSmallScreen
              ? "w-0 opacity-0 overflow-hidden"
              : "w-64 opacity-100"
        }`}
      >
        {/* Expanded sidebar toggle button (show only on small screens when expanded) */}
        {isSmallScreen && sidebarExpanded && (
          <div className="absolute top-12 right-2 z-20">
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center rounded border border-gray-300 w-6 h-6 hover:bg-gray-100"
              aria-label="Collapse sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="stroke-gray-300"
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
          <DocsSidebar
            product={product}
            section={section}
            currentSlug={slug}
            currentGroup={group}
            docs={docs}
          />
        </div>
      </div>
    </div>
  );
};

export default SidebarContainer;
