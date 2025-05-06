import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils";
import SidebarContainer from "./SidebarContainer";

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
}

/**
 * Left sidebar component with fixed positioning and collapsible behavior
 *
 * Uses SidebarContainer for responsive collapsing on small screens.
 * Sidebar content scrolls independently from main content.
 */
AppLayout.LeftSidebar = ({ children, className }: SidebarProps) => {
  return (
    <SidebarContainer>
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
 */
AppLayout.RightSidebar = ({ children, className }: SidebarProps) => {
  return (
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
  );
};

export default AppLayout;
