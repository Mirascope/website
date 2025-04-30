import React from "react";
import { Link, useMatches } from "@tanstack/react-router";
import { cn } from "@/src/lib/utils";

/**
 * Generic section item data structure for sidebar navigation
 */
export interface SidebarItem {
  slug: string; // URL-friendly identifier
  label: string; // Display label for sidebar
  routePath?: string; // Optional explicit route path (overrides constructed path)
  items?: Record<string, SidebarItem>; // Nested items
}

/**
 * Group of related sidebar items
 */
export interface SidebarGroup {
  slug: string; // URL-friendly identifier for path construction
  label: string; // Display label
  items: Record<string, SidebarItem>;
}

/**
 * Section of sidebar (like "API", "Guides", etc.)
 */
export interface SidebarSection {
  slug: string;
  label: string;
  basePath: string;
  items?: Record<string, SidebarItem>;
  groups?: Record<string, SidebarGroup>;
}

/**
 * Main sidebar configuration with theme support
 */
export interface SidebarConfig {
  label?: string;
  sections: SidebarSection[];
}

interface SidebarProps {
  config: SidebarConfig;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

/**
 * Reusable link component for sidebar items
 */
const SidebarLink = ({
  to,
  isActive,
  className = "",
  style,
  params,
  children,
}: {
  to: string;
  isActive: boolean;
  className?: string;
  style?: React.CSSProperties;
  params?: Record<string, any>;
  children: React.ReactNode;
}) => {
  const activeClass = `bg-accent text-accent-foreground font-medium`;
  const inactiveClass = `text-muted-foreground hover:bg-muted hover:text-muted-foreground`;

  return (
    <Link
      to={to}
      params={params}
      style={style}
      className={cn(
        "block rounded-md py-1 text-base",
        className,
        isActive ? activeClass : inactiveClass
      )}
    >
      {children}
    </Link>
  );
};

/**
 * Tab for selecting sections
 */
const SectionTab = ({
  to,
  isActive,
  className = "",
  params,
  children,
}: {
  to: string;
  isActive: boolean;
  className?: string;
  params?: Record<string, any>;
  children: React.ReactNode;
}) => {
  const activeClass = `bg-button-primary text-white font-medium`;
  const inactiveClass = `text-muted-foreground hover:bg-accent hover:text-accent-foreground`;

  return (
    <Link
      to={to}
      params={params}
      className={cn(
        "w-full rounded-md px-3 py-1 text-base",
        className,
        isActive ? activeClass : inactiveClass
      )}
    >
      {children}
    </Link>
  );
};

/**
 * Group label header
 */
const GroupLabel = ({ label }: { label: string }) => {
  return (
    <div className={cn("text-primary block cursor-default px-3 py-1 font-semibold")}>{label}</div>
  );
};

/**
 * Component for rendering nested items (folders)
 */
interface NestedItemsProps {
  items: Record<string, SidebarItem>;
  basePath: string;
  isActivePath: (path: string, routePath?: string) => boolean;
  indentLevel?: number;
}

/**
 * Individual nested item component
 */
const NestedItem = ({
  itemSlug,
  item,
  basePath,
  isActivePath,
  indentLevel,
}: {
  itemSlug: string;
  item: SidebarItem;
  basePath: string;
  isActivePath: (path: string, routePath?: string) => boolean;
  indentLevel: number;
}) => {
  // For navigation: Use routePath if provided, otherwise construct the path
  const navigationUrl = item.routePath || `${basePath}/${itemSlug}`;

  // For active state determination: Use the logical path which may include /index
  const logicalPath = `${basePath}/${itemSlug}`;

  // A folder is any item that has nested items
  const children = item.items || {};
  const hasNestedItems = Object.keys(children).length > 0;

  // Determine if this folder or any of its children are active
  // Use routePath if provided, otherwise use the logical path
  const isActive = isActivePath(logicalPath, item.routePath);

  // State to track if the folder is expanded
  const [isExpanded, setIsExpanded] = React.useState(isActive);

  // Auto-expand only when a folder becomes active, not on every render
  React.useEffect(() => {
    // Only auto-expand when the item first becomes active
    // Don't re-expand after user explicitly closes it
    if (isActive && !isExpanded) {
      setIsExpanded(true);
    }
    // Omitting isExpanded from dependencies to prevent re-expanding after user closes
  }, [isActive]);

  return (
    <div key={itemSlug}>
      <div className={cn("flex items-center rounded-md")}>
        {/* Render expand/collapse icon for folders */}
        {hasNestedItems && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn("mr-1 flex h-5 w-5 items-center justify-center")}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="transition-transform"
              style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke="currentColor"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}

        {/* For folders, render a clickable span that toggles expansion */}
        {hasNestedItems ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "hover:text-muted-foreground hover:bg-muted block w-full rounded-md py-1 text-left font-medium",
              isActive ? "text-accent" : "text-muted-foreground"
            )}
            style={{
              paddingLeft: hasNestedItems ? "0" : `${0.75 + indentLevel * 0.5}rem`,
              paddingRight: "0.75rem",
              flex: 1,
            }}
          >
            {item.label}
          </button>
        ) : (
          /* Render regular items as links */
          <SidebarLink
            to={navigationUrl}
            isActive={isActive}
            className=""
            style={{
              paddingLeft: `${0.75 + indentLevel * 0.5}rem`,
              paddingRight: "0.75rem",
              flex: 1,
            }}
          >
            {item.label}
          </SidebarLink>
        )}
      </div>

      {/* Render nested items if exists and is expanded */}
      {hasNestedItems && isExpanded && (
        <div className="pt-1 pb-2">
          <NestedItems
            items={children}
            basePath={logicalPath}
            isActivePath={isActivePath}
            indentLevel={indentLevel + 1}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Container component for a group of nested items
 */
const NestedItems = ({ items, basePath, isActivePath, indentLevel = 0 }: NestedItemsProps) => {
  // Ensure we always have an object, even if items is undefined
  const safeItems = items || {};

  return (
    <div className={`mt-1 space-y-0.5 ${indentLevel > 0 ? "ml-3" : ""}`}>
      {Object.entries(safeItems).map(([itemSlug, item]) => (
        <NestedItem
          key={itemSlug}
          itemSlug={itemSlug}
          item={item}
          basePath={basePath}
          isActivePath={isActivePath}
          indentLevel={indentLevel}
        />
      ))}
    </div>
  );
};

/**
 * Renders content for a specific section
 */
const SectionContent = ({
  section,
  isActivePath,
}: {
  section: SidebarSection;
  isActivePath: (path: string) => boolean;
}) => {
  if (!section) return null;

  return (
    <>
      {/* Section top-level items */}
      {section.items && Object.keys(section.items).length > 0 && (
        <NestedItems
          items={section.items}
          basePath={section.basePath}
          isActivePath={isActivePath}
        />
      )}

      {/* Section groups */}
      {section.groups &&
        Object.entries(section.groups).map(([groupSlug, group]) => {
          return (
            <div key={groupSlug} className="pt-2">
              {/* Group label - not selectable/highlightable */}
              <GroupLabel label={group.label} />

              {/* Group items */}
              <NestedItems
                items={group.items}
                basePath={`${section.basePath}/${groupSlug}`}
                isActivePath={isActivePath}
                indentLevel={1}
              />
            </div>
          );
        })}
    </>
  );
};

/**
 * Generic sidebar component that can be used for any navigation structure
 */
const Sidebar = ({ config, headerContent, footerContent }: SidebarProps) => {
  // Get current route from TanStack Router
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.pathname || "";

  // Store and restore scroll position
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const sidebarId = config.label ? config.label.toLowerCase().replace(/\s+/g, "-") : "sidebar";

  // Use state to track the last path, to know when navigation happens
  const [lastPath, setLastPath] = React.useState(currentPath);

  // When the current path changes, update lastPath state
  React.useEffect(() => {
    // Save the current scroll position before changing paths
    if (lastPath !== currentPath && sidebarRef.current) {
      const scrollKey = `sidebar-scroll-${sidebarId}`;
      sessionStorage.setItem(scrollKey, sidebarRef.current.scrollTop.toString());
    }

    setLastPath(currentPath);
  }, [currentPath, lastPath, sidebarId]);

  // Restore scroll position on mount and after page changes
  React.useEffect(() => {
    const scrollKey = `sidebar-scroll-${sidebarId}`;

    // Restore scroll position with minimal delay to ensure rendering is complete
    // Use requestAnimationFrame for the best timing with browser rendering cycle
    const timer = requestAnimationFrame(() => {
      const savedScroll = sessionStorage.getItem(scrollKey);
      if (savedScroll && sidebarRef.current) {
        sidebarRef.current.scrollTop = parseInt(savedScroll, 10);
      }
    });

    return () => cancelAnimationFrame(timer);
  }, [sidebarId, currentPath]);

  // Helper function to check if a path matches the current path
  const isActivePath = (path: string, routePath?: string) => {
    // If a routePath is provided, check that first
    if (routePath && routePath === currentPath) {
      return true;
    }

    // For index pages, their logical path is e.g. /docs/product/index
    // but the current path will be /docs/product/ in the browser
    // Check for direct match with current path (as-is)
    if (path === currentPath) {
      return true;
    }

    // Then check for index-specific matches
    if (path.endsWith("/index")) {
      // Remove 'index' to get the parent path with trailing slash
      const parentPath = path.slice(0, -5);

      // Check if current path equals the parent path (with or without trailing slash)
      if (parentPath === currentPath || parentPath === currentPath + "/") {
        return true;
      }
    }

    // If it's not an index page, check parent/child relationship
    // Normalize paths by ensuring they end with a slash
    const normalizedPath = path.endsWith("/") ? path : `${path}/`;
    const normalizedCurrentPath = currentPath.endsWith("/") ? currentPath : `${currentPath}/`;

    // Special case to avoid matching the root path with everything
    if (normalizedPath === "/") {
      return normalizedCurrentPath === "/";
    }

    return normalizedCurrentPath.startsWith(normalizedPath);
  };

  // Find active section by checking which section's base path matches the current path
  // Preserve the original order from config, but find the most specific match (longest path)
  const matchingSections = config.sections
    .filter((section) => currentPath.startsWith(section.basePath))
    .sort((a, b) => b.basePath.length - a.basePath.length);

  // Use the most specific match (if any), otherwise undefined
  const activeSection = matchingSections.length > 0 ? matchingSections[0].slug : undefined;

  return (
    <aside className="h-full overflow-hidden pt-6">
      {/* Custom header content if provided */}
      {headerContent && <div className="mb-5">{headerContent}</div>}

      {/* Section tabs */}
      {config.sections.length > 1 && (
        <>
          <div className="mb-4 flex flex-col space-y-0.5">
            {config.sections.map((section) => (
              <SectionTab
                key={section.slug}
                to={section.basePath}
                isActive={section.slug === activeSection}
              >
                {section.label}
              </SectionTab>
            ))}
          </div>

          {/* Border line below section buttons */}
          <div className="pb-4">
            <div className="border-muted border-1 border-b"></div>
          </div>
        </>
      )}

      {/* Scrollable content area with fixed height */}
      <div className="flex h-[calc(100vh-220px)] flex-col">
        <div
          ref={sidebarRef}
          className="flex-1 overflow-y-auto" // Flexbox will allow this to fill available space
        >
          <nav className="space-y-1">
            {/* Show content for active section */}
            {activeSection ? (
              <SectionContent
                section={config.sections.find((s) => s.slug === activeSection)!}
                isActivePath={isActivePath}
              />
            ) : (
              // If no active section, show first section as default
              config.sections.length > 0 && (
                <SectionContent section={config.sections[0]} isActivePath={isActivePath} />
              )
            )}
          </nav>
        </div>

        {/* Fixed non-scrollable footer buffer */}
        <div className="h-24 flex-shrink-0">
          {/* Footer content if provided */}
          {footerContent}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
