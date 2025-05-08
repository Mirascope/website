import type { ReactNode } from "react";
import { useState, createContext, useContext, useEffect } from "react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useSidebar } from "./useSidebar";

// Create a context to coordinate sidebar states
type SidebarContextType = {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  isSmallScreen: boolean;
  isPhoneScreen: boolean;
  toggleLeftSidebar: ReturnType<typeof useSidebar>;
  toggleRightSidebar: ReturnType<typeof useSidebar>;
};

const SidebarContext = createContext<SidebarContextType>({
  leftSidebarOpen: false,
  rightSidebarOpen: false,
  setLeftSidebarOpen: () => {},
  setRightSidebarOpen: () => {},
  isSmallScreen: false,
  isPhoneScreen: false,
  toggleLeftSidebar: {
    isOpen: false,
    setIsOpen: () => {},
    toggle: () => {},
    open: () => {},
    close: () => {},
    closeBtnRef: { current: null },
    previouslyFocusedElementRef: { current: null },
  },
  toggleRightSidebar: {
    isOpen: false,
    setIsOpen: () => {},
    toggle: () => {},
    open: () => {},
    close: () => {},
    closeBtnRef: { current: null },
    previouslyFocusedElementRef: { current: null },
  },
});

/**
 * AppLayout - Comprehensive layout component with composable parts
 *
 * Provides a consistent page structure with main content area and
 * optional sidebars. Sidebars use fixed positioning for scrolling behavior.
 * Manages responsive behavior for both left and right sidebars.
 * Header spacing is handled by the root layout.
 *
 * Usage example:
 * ```tsx
 * <AppLayout>
 *   <AppLayout.LeftSidebar>Left sidebar content</AppLayout.LeftSidebar>
 *   <AppLayout.Content>Main content</AppLayout.Content>
 *   <AppLayout.RightSidebar>Right sidebar content</AppLayout.RightSidebar>
 * </AppLayout>
 * ```
 */
const AppLayout = ({ children }: { children: ReactNode }) => {
  // Track screen size breakpoints
  const [isSmallScreen, setIsSmallScreen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768; // md breakpoint is 768px in Tailwind
    }
    return false; // Default to large screen for SSR
  });

  // Additional breakpoint for extra small screens (phones)
  const [isPhoneScreen, setIsPhoneScreen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 480; // Extra small breakpoint for phones
    }
    return false; // Default to larger screen for SSR
  });

  // Create sidebar controllers with coordinated behavior
  const leftSidebar = useSidebar({
    initialOpen: true,
    isSmallScreen,
  });

  const rightSidebar = useSidebar({
    initialOpen: false,
    isSmallScreen,
    onOtherSidebarOpen: () => leftSidebar.close(),
  });

  // Simplified state hooks for API compatibility
  const leftSidebarOpen = leftSidebar.isOpen;
  const rightSidebarOpen = rightSidebar.isOpen;
  const setLeftSidebarOpen = leftSidebar.setIsOpen;
  const setRightSidebarOpen = rightSidebar.setIsOpen;

  // Update breakpoint state based on window resize
  useEffect(() => {
    const handleResize = () => {
      const windowWidth = window.innerWidth;
      const smallScreen = windowWidth < 768;
      const phoneScreen = windowWidth < 480;
      const wasSmallScreen = isSmallScreen;

      // Update screen size states
      setIsSmallScreen(smallScreen);
      setIsPhoneScreen(phoneScreen);

      // Auto-expand left sidebar on large screens, collapse on small
      if (!smallScreen && wasSmallScreen) {
        setLeftSidebarOpen(true);
      } else if (smallScreen && !wasSmallScreen) {
        setLeftSidebarOpen(false);
      }
    };

    // Initialize on first render
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => window.removeEventListener("resize", handleResize);
  }, [isSmallScreen, setLeftSidebarOpen]);

  // Manage body scroll lock when sidebars are open on mobile
  useEffect(() => {
    if (isSmallScreen && (leftSidebarOpen || rightSidebarOpen)) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSmallScreen, leftSidebarOpen, rightSidebarOpen]);

  return (
    <SidebarContext.Provider
      value={{
        leftSidebarOpen,
        rightSidebarOpen,
        setLeftSidebarOpen,
        setRightSidebarOpen,
        isSmallScreen,
        isPhoneScreen,
        toggleLeftSidebar: leftSidebar,
        toggleRightSidebar: rightSidebar,
      }}
    >
      <div className="flex justify-center">
        <div className="mx-auto flex w-full max-w-7xl">{children}</div>
      </div>
    </SidebarContext.Provider>
  );
};

interface SidebarProps {
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
}

interface RightSidebarProps extends SidebarProps {
  mobileCollapsible?: boolean;
  mobileTitle?: string;
}

/**
 * Shared backdrop component for mobile sidebar overlays
 */
const SidebarBackdrop = ({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) => (
  <div
    className={`bg-background/30 fixed inset-0 backdrop-blur-sm transition-all duration-300 ${
      isOpen ? "z-40 opacity-100" : "pointer-events-none -z-10 opacity-0"
    }`}
    onClick={onClick}
    aria-hidden="true"
    role="presentation"
  />
);

/**
 * Left sidebar component with fixed positioning and collapsible behavior
 *
 * Handles responsive collapsing on small screens.
 * Sidebar content scrolls independently from main content.
 */
AppLayout.LeftSidebar = ({ children, className, collapsible = true }: SidebarProps) => {
  const { leftSidebarOpen, setLeftSidebarOpen, isSmallScreen, isPhoneScreen, toggleLeftSidebar } =
    useContext(SidebarContext);

  return (
    <>
      {/* Container - zero width on mobile, fixed width on desktop */}
      <div className={`flex flex-shrink-0 ${isSmallScreen ? "w-0" : "w-64"}`}>
        {/* Blurred backdrop - only visible on mobile when expanded */}
        {isSmallScreen && (
          <SidebarBackdrop isOpen={leftSidebarOpen} onClick={() => setLeftSidebarOpen(false)} />
        )}

        {/* Toggle button - only visible on small screens when collapsible */}
        {isSmallScreen && collapsible && (
          <button
            ref={toggleLeftSidebar.closeBtnRef}
            onClick={toggleLeftSidebar.toggle}
            className={`bg-accent/90 text-accent-foreground fixed top-[calc(var(--header-height)-2.5rem)] left-2 z-80 flex items-center justify-center rounded-full shadow-sm ${
              isPhoneScreen ? "h-9 w-9" : "h-9 w-9"
            }`}
            aria-label={leftSidebarOpen ? "Close sidebar" : "Open sidebar"}
            aria-expanded={leftSidebarOpen}
            aria-controls="left-sidebar-content"
          >
            {leftSidebarOpen ? (
              <X size={isPhoneScreen ? 22 : 20} />
            ) : (
              <ChevronRight size={isPhoneScreen ? 22 : 20} />
            )}
          </button>
        )}

        {/* Sidebar content panel */}
        <div
          id="left-sidebar-content"
          className={`bg-background/95 fixed top-[var(--header-height)] h-[calc(100vh-var(--header-height))] backdrop-blur-sm transition-all duration-300 ease-in-out ${!collapsible && isSmallScreen ? "hidden" : ""} ${
            isPhoneScreen
              ? "w-[calc(100vw-20px)] rounded-r-md" // Almost full width on phones, with slight margin
              : isSmallScreen
                ? "w-[85vw] max-w-xs rounded-r-md" // 85% width on tablets with rounded corner
                : "w-64 rounded-r-md" // Fixed width on desktop
          } ${
            leftSidebarOpen
              ? "translate-x-0"
              : "translate-x-[-110%]" /* Move completely out of view */
          } border-border/40 z-40 overflow-hidden ${isPhoneScreen ? "" : "border-r"}`}
          style={{
            boxShadow: leftSidebarOpen && isSmallScreen ? "0 8px 16px rgba(0, 0, 0, 0.08)" : "none",
            transition: `transform ${isPhoneScreen ? "250ms" : "300ms"} ease-in-out, 
                        opacity 300ms ease-in-out`,
          }}
          aria-hidden={!leftSidebarOpen}
          role="navigation"
        >
          <div className={`h-full overflow-y-auto ${isPhoneScreen ? "px-5" : "px-4"}`}>
            {/* Only render sidebar content when expanded on mobile or always on desktop */}
            {(leftSidebarOpen || !isSmallScreen) && (
              <div className={cn("h-full overflow-y-auto", className)}>{children}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Main content area
 *
 * Expands to fill available space between sidebars and scrolls independently.
 */
AppLayout.Content = ({ children, className }: SidebarProps) => {
  return <div className={cn("min-w-0 flex-1", className)}>{children}</div>;
};

/**
 * Right sidebar component with fixed positioning
 *
 * Provides a consistent container for right sidebar content that
 * remains fixed while the main content scrolls.
 *
 * When mobileCollapsible is true, the sidebar will be accessible on mobile
 * devices via a toggle button that shows a slide-in panel.
 */
AppLayout.RightSidebar = ({
  children,
  className,
  mobileCollapsible = false,
  mobileTitle = "Table of Contents",
}: RightSidebarProps) => {
  const {
    rightSidebarOpen,
    setRightSidebarOpen,
    isSmallScreen,
    leftSidebarOpen,
    toggleRightSidebar,
  } = useContext(SidebarContext);

  return (
    <>
      {/* Desktop version - always visible on large screens */}
      <div className="hidden w-56 flex-shrink-0 lg:block">
        {children && (
          <div
            className={cn(
              "fixed top-[var(--header-height)] h-[calc(100vh-var(--header-height))]",
              "w-56 max-w-[14rem] overflow-y-auto",
              className
            )}
          >
            {children}
          </div>
        )}
      </div>

      {/* Mobile version - only render if mobileCollapsible is true */}
      {mobileCollapsible && children && (
        <>
          {/* Mobile toggle button - hidden when left sidebar is open */}
          <div
            className={cn(
              "fixed right-6 bottom-6 z-40 flex flex-col gap-2 lg:hidden",
              leftSidebarOpen ? "hidden" : ""
            )}
          >
            <Button
              variant="outline"
              size="icon"
              onClick={toggleRightSidebar.toggle}
              className={cn(
                "h-10 w-10 rounded-full border-1 p-0 shadow-md",
                rightSidebarOpen ? "bg-muted" : "bg-background"
              )}
              ref={toggleRightSidebar.closeBtnRef}
              aria-label={rightSidebarOpen ? "Close table of contents" : "Open table of contents"}
              aria-expanded={rightSidebarOpen}
              aria-controls="right-sidebar-content"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </div>

          {/* Mobile backdrop overlay */}
          {isSmallScreen && (
            <SidebarBackdrop isOpen={rightSidebarOpen} onClick={() => setRightSidebarOpen(false)} />
          )}

          {/* Mobile slide-in panel */}
          <div
            id="right-sidebar-content"
            className={`bg-background border-border fixed top-[var(--header-height)] right-0 z-40 h-[calc(100vh-var(--header-height))] w-72 rounded-md border-l shadow-lg ${rightSidebarOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out lg:hidden`}
            aria-hidden={!rightSidebarOpen}
            role="complementary"
          >
            <div className="flex h-full flex-col">
              <div className="border-border m-1 flex items-center justify-between border-b p-4">
                <h3 className="font-medium">{mobileTitle}</h3>
                <button
                  onClick={() => setRightSidebarOpen(false)}
                  className="hover:bg-muted rounded-md p-1"
                  aria-label="Close sidebar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-grow overflow-y-auto px-4 py-4">{children}</div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AppLayout;
