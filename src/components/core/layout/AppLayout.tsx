import type { ReactNode } from "react";
import { useState, createContext, useContext } from "react";
import { cn } from "@/src/lib/utils";
import SidebarContainer from "./SidebarContainer";
import { Button } from "@/src/components/ui/button";
import { ChevronLeft, X } from "lucide-react";

// Create a context to coordinate sidebar states
type SidebarContextType = {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
};

const SidebarContext = createContext<SidebarContextType>({
  leftSidebarOpen: false,
  rightSidebarOpen: false,
  setLeftSidebarOpen: () => {},
  setRightSidebarOpen: () => {},
});

/**
 * AppLayout - Comprehensive layout component with composable parts
 *
 * Provides a consistent page structure with main content area and
 * optional sidebars. Sidebars use fixed positioning for scrolling behavior.
 * Left sidebar uses SidebarContainer for responsive collapsing.
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
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        leftSidebarOpen,
        rightSidebarOpen,
        setLeftSidebarOpen,
        setRightSidebarOpen,
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
 * Left sidebar component with fixed positioning and collapsible behavior
 *
 * Uses SidebarContainer for responsive collapsing on small screens.
 * Sidebar content scrolls independently from main content.
 */
AppLayout.LeftSidebar = ({ children, className, collapsible = true }: SidebarProps) => {
  const { leftSidebarOpen, setLeftSidebarOpen, setRightSidebarOpen } = useContext(SidebarContext);

  const handleLeftSidebarToggle = (open: boolean) => {
    setLeftSidebarOpen(open);
    // Close the right sidebar when opening the left sidebar
    if (open) {
      setRightSidebarOpen(false);
    }
  };

  return (
    <SidebarContainer
      collapsible={collapsible}
      isOpen={leftSidebarOpen}
      onToggle={handleLeftSidebarToggle}
    >
      <div className={cn("h-full overflow-y-auto", className)}>{children}</div>
    </SidebarContainer>
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
  const { rightSidebarOpen, setRightSidebarOpen, leftSidebarOpen, setLeftSidebarOpen } =
    useContext(SidebarContext);

  const toggleRightSidebar = () => {
    const newState = !rightSidebarOpen;
    setRightSidebarOpen(newState);

    // Close the left sidebar when opening the right sidebar
    if (newState && leftSidebarOpen) {
      setLeftSidebarOpen(false);
    }
  };

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
              onClick={toggleRightSidebar}
              className={cn(
                "h-10 w-10 rounded-full border-1 p-0 shadow-md",
                rightSidebarOpen ? "bg-muted" : "bg-background"
              )}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </div>

          {/* Mobile backdrop overlay */}
          {rightSidebarOpen && (
            <div
              className="bg-background/50 fixed inset-0 z-30 lg:hidden"
              onClick={() => setRightSidebarOpen(false)}
            ></div>
          )}

          {/* Mobile slide-in panel */}
          <div
            className={`bg-background border-border fixed top-[var(--header-height)] right-0 z-40 h-[calc(100vh-var(--header-height))] w-72 rounded-md border-l shadow-lg ${rightSidebarOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out lg:hidden`}
          >
            <div className="flex h-full flex-col">
              <div className="border-border m-1 flex items-center justify-between border-b p-4">
                <h3 className="font-medium">{mobileTitle}</h3>
                <button
                  onClick={() => setRightSidebarOpen(false)}
                  className="hover:bg-muted rounded-md p-1"
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
