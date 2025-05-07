import type { ReactNode } from "react";
import { useState } from "react";
import { cn } from "@/src/lib/utils";
import SidebarContainer from "./SidebarContainer";
import { Button } from "@/src/components/ui/button";
import { Menu, X } from "lucide-react";

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
  return (
    <div className="flex justify-center">
      <div className="mx-auto flex w-full max-w-7xl">{children}</div>
    </div>
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
  return (
    <SidebarContainer collapsible={collapsible}>
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
  const [tocOpen, setTocOpen] = useState(false);

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
          {/* Mobile toggle button */}
          <div className="fixed right-6 bottom-6 z-40 flex flex-col gap-2 lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTocOpen(!tocOpen)}
              className={cn(
                "h-12 w-12 rounded-full p-0 shadow-md",
                tocOpen ? "bg-muted" : "bg-background"
              )}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile backdrop overlay */}
          {tocOpen && (
            <div
              className="bg-background/50 fixed inset-0 z-30 lg:hidden"
              onClick={() => setTocOpen(false)}
            ></div>
          )}

          {/* Mobile slide-in panel */}
          <div
            className={`bg-background border-border fixed top-[var(--header-height)] right-0 z-40 h-[calc(100vh-var(--header-height))] w-72 rounded-md border-l shadow-lg ${tocOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out lg:hidden`}
          >
            <div className="flex h-full flex-col">
              <div className="border-border flex items-center justify-between border-b p-4">
                <h3 className="font-medium">{mobileTitle}</h3>
                <button onClick={() => setTocOpen(false)} className="hover:bg-muted rounded-md p-1">
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
