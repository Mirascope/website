import React, { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";

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

  // Ref for tracking previous expanded state for focus management
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Toggle sidebar expanded/collapsed (only used on small screens)
  const toggleSidebar = () => {
    if (isSmallScreen) {
      // Save the currently focused element when opening
      if (!sidebarExpanded) {
        previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
      }

      const newExpandedState = !sidebarExpanded;
      setSidebarExpanded(newExpandedState);

      // Manage body scroll lock
      if (newExpandedState) {
        document.body.style.overflow = "hidden";
        // Focus the close button when sidebar opens
        setTimeout(() => {
          closeBtnRef.current?.focus();
        }, 100);
      } else {
        document.body.style.overflow = "";
        // Restore focus when sidebar closes
        setTimeout(() => {
          previouslyFocusedElementRef.current?.focus();
        }, 100);
      }
    }
  };

  // Handle Escape key to close sidebar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && sidebarExpanded && isSmallScreen) {
        toggleSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarExpanded, isSmallScreen]);

  // Cleanup body overflow when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      {/* Container - zero width on mobile, fixed width on desktop */}
      <div className={`flex flex-shrink-0 ${isSmallScreen ? "w-0" : "w-64"}`}>
        {/* Blurred backdrop - only visible on mobile when expanded */}
        {isSmallScreen && (
          <div
            className={`bg-background/30 fixed inset-0 backdrop-blur-sm transition-all duration-300 ${
              sidebarExpanded ? "z-40 opacity-100" : "pointer-events-none -z-10 opacity-0"
            }`}
            onClick={toggleSidebar}
            aria-hidden="true"
            role="presentation"
          />
        )}

        {/* Toggle button - switches between hamburger and X icons */}
        {isSmallScreen && (
          <button
            ref={closeBtnRef}
            onClick={toggleSidebar}
            className="bg-primary/90 text-primary-foreground fixed top-[calc(var(--header-height)-2.2rem)] left-3 z-80 flex h-9 w-9 items-center justify-center rounded-full shadow-sm"
            aria-label={sidebarExpanded ? "Close sidebar" : "Open sidebar"}
            aria-expanded={sidebarExpanded}
            aria-controls="sidebar-content"
          >
            {sidebarExpanded ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        {/* Sidebar content panel */}
        <div
          id="sidebar-content"
          className={`bg-background/95 fixed top-[var(--header-height)] h-[calc(100vh-var(--header-height))] rounded-md backdrop-blur-sm transition-transform duration-300 ease-in-out ${
            isSmallScreen ? "w-[85vw] max-w-xs" : "w-64"
          } ${
            sidebarExpanded
              ? "translate-x-0"
              : "translate-x-[-110%]" /* Move completely out of view */
          } border-border/40 z-50 overflow-hidden border-r`}
          style={{
            boxShadow: sidebarExpanded && isSmallScreen ? "0 8px 16px rgba(0, 0, 0, 0.08)" : "none",
          }}
          aria-hidden={!sidebarExpanded}
          role="navigation"
        >
          <div className="h-full overflow-y-auto p-4">
            {/* Only render sidebar content when expanded on mobile or always on desktop */}
            {(sidebarExpanded || !isSmallScreen) && children}
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarContainer;
