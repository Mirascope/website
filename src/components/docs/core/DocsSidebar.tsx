import React from "react";
import { Link, useMatches } from "@tanstack/react-router";
import { cn } from "@/src/lib/utils";
import docsMetadata from "@/content/doc/_meta";
import { getSectionsForProduct } from "@/src/lib/content/docs";
import { getProductRoute, getSectionRoute, getSectionParams } from "@/src/lib/routes";
import type { ProductName } from "@/src/lib/route-types";
import type { DocMeta } from "@/src/lib/content/docs";
import { type Provider } from "../ProviderContext";

interface DocsSidebarProps {
  product: ProductName;
  section: string | null;
  currentSlug: string;
  currentGroup: string | null;
  docs: DocMeta[];
  selectedProvider?: Provider;
  onProviderChange?: (provider: Provider) => void;
}

// Components for common UI patterns
const ProductTitle = ({ product }: { product: ProductName }) => {
  const titleClass = `text-xl font-medium ${product === "mirascope" ? "text-mirascope-purple" : "text-lilypad-green"}`;
  return <span className={titleClass}>{product === "mirascope" ? "Mirascope" : "Lilypad"}</span>;
};

const ProductLink = ({ product }: { product: ProductName }) => {
  return (
    <Link
      to={getProductRoute(product)}
      className={`text-xl font-medium text-muted-foreground hover:text-accent-foreground`}
    >
      {product === "mirascope" ? "Mirascope" : "Lilypad"}
    </Link>
  );
};

interface SidebarLinkProps {
  to: string;
  isActive: boolean;
  product: ProductName;
  className?: string;
  style?: React.CSSProperties;
  params?: Record<string, any>;
  children: React.ReactNode;
}

const SidebarLink = ({
  to,
  isActive,
  product,
  className = "",
  style,
  params,
  children,
}: SidebarLinkProps) => {
  const activeClass =
    product === "mirascope"
      ? "bg-button-primary text-white font-medium"
      : "bg-lilypad-green text-white font-medium";

  const inactiveClass = "text-muted-foreground hover:bg-accent hover:text-accent-foreground";

  return (
    <Link
      to={to}
      params={params}
      style={style}
      className={cn(
        "block text-base rounded-md",
        className,
        isActive ? activeClass : inactiveClass
      )}
    >
      {children}
    </Link>
  );
};

const SectionTab = ({
  to,
  isActive,
  product,
  className = "",
  params,
  children,
}: SidebarLinkProps) => {
  const activeClass =
    product === "mirascope"
      ? "bg-button-primary text-white font-medium"
      : "bg-lilypad-green text-white font-medium";

  const inactiveClass = "text-muted-foreground hover:bg-accent hover:text-accent-foreground";

  return (
    <Link
      to={to}
      params={params}
      className={cn(
        "px-3 py-1 text-base rounded-md w-full",
        className,
        isActive ? activeClass : inactiveClass
      )}
    >
      {children}
    </Link>
  );
};

const GroupTitle = ({ title, product }: { title: string; product: ProductName }) => {
  const titleClass = product === "mirascope" ? "text-mirascope-purple" : "text-lilypad-green";
  return (
    <div
      className={cn("font-semibold px-3 py-1 block text-button-primary cursor-default", titleClass)}
    >
      {title}
    </div>
  );
};

const DocsSidebar = ({ product, currentGroup }: DocsSidebarProps) => {
  // Get current route from TanStack Router
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.pathname || "";

  // Get metadata for this product
  const productData = docsMetadata[product];
  const sections = getSectionsForProduct(product);

  // Store and restore scroll position
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  // Use state to track the last path, to know when navigation happens
  const [lastPath, setLastPath] = React.useState(currentPath);

  // When the current path changes, update lastPath state
  React.useEffect(() => {
    // Save the current scroll position before changing paths
    if (lastPath !== currentPath && sidebarRef.current) {
      const scrollKey = `sidebar-scroll-${product}`;
      sessionStorage.setItem(scrollKey, sidebarRef.current.scrollTop.toString());
    }

    setLastPath(currentPath);
  }, [currentPath, lastPath, product]);

  // Restore scroll position on mount and after page changes
  React.useEffect(() => {
    const scrollKey = `sidebar-scroll-${product}`;

    // Restore scroll position with minimal delay to ensure rendering is complete
    // Use requestAnimationFrame for the best timing with browser rendering cycle
    const timer = requestAnimationFrame(() => {
      const savedScroll = sessionStorage.getItem(scrollKey);
      if (savedScroll && sidebarRef.current) {
        sidebarRef.current.scrollTop = parseInt(savedScroll, 10);
      }
    });

    return () => cancelAnimationFrame(timer);
  }, [product, currentPath]);

  // Create ordered sections with Guides between Docs and API
  let orderedSections = [...sections]; // Clone the array
  if (sections.some((s) => s.slug === "guides") && sections.some((s) => s.slug === "api")) {
    // Filter out guides and api first
    const guidesSection = sections.find((s) => s.slug === "guides");
    const apiSection = sections.find((s) => s.slug === "api");
    const otherSections = sections.filter((s) => s.slug !== "guides" && s.slug !== "api");

    // Rebuild the array in the desired order: [other sections, guides, api]
    orderedSections = [...otherSections];
    if (guidesSection) orderedSections.push(guidesSection);
    if (apiSection) orderedSections.push(apiSection);
  }

  // For unknown products, only show the product selector
  if (!productData) {
    return (
      <aside className="h-full pt-6 pb-12">
        <div className="mb-2">
          {/* Product selector only */}
          <div className="flex mb-5 space-x-4">
            {product === "mirascope" ? (
              <ProductTitle product="mirascope" />
            ) : (
              <ProductLink product="mirascope" />
            )}

            {product === "lilypad" ? (
              <ProductTitle product="lilypad" />
            ) : (
              <ProductLink product="lilypad" />
            )}
          </div>
        </div>
      </aside>
    );
  }

  // Get all sections from _meta.ts
  const allSections = Object.keys(productData?.sections || {});

  // Check if the current URL contains any of the sections from _meta.ts
  const matchingSection = allSections.find((s) => currentPath.startsWith(`/docs/${product}/${s}/`));

  // Docs tab is active only if we're not in a section
  const isDocsTabActive = !matchingSection;

  // Helper function to check if a path matches the current path
  const isActivePath = (path: string) => {
    // Remove "/index" from paths for comparison
    const cleanPath = path.replace(/\/index$/, "");
    const cleanCurrentPath = currentPath.replace(/\/index$/, "");

    // Normalize paths by ensuring they end with a slash
    const normalizedPath = cleanPath.endsWith("/") ? cleanPath : `${cleanPath}/`;
    const normalizedCurrentPath = cleanCurrentPath.endsWith("/")
      ? cleanCurrentPath
      : `${cleanCurrentPath}/`;

    // Special case for product landing - both /docs/product and /docs/product/ should match
    if (
      cleanPath === `/docs/${product}` &&
      (cleanCurrentPath === `/docs/${product}` || cleanCurrentPath === `/docs/${product}/`)
    ) {
      return true;
    }

    // Special case for group index pages - check if we're viewing any page in this group
    if (cleanPath.includes(`/${currentGroup}/`) && currentGroup) {
      if (normalizedCurrentPath.startsWith(normalizedPath)) {
        return true;
      }
    }

    // Direct path match (either with original or clean paths)
    return cleanCurrentPath === cleanPath || normalizedCurrentPath === normalizedPath;
  };

  return (
    <aside className="h-full pt-6 overflow-hidden">
      <div className="mb-2">
        {/* Product selector */}
        <div className="flex mb-5 space-x-4">
          {product === "mirascope" ? (
            <ProductTitle product="mirascope" />
          ) : (
            <ProductLink product="mirascope" />
          )}

          {product === "lilypad" ? (
            <ProductTitle product="lilypad" />
          ) : (
            <ProductLink product="lilypad" />
          )}
        </div>

        {/* Section tabs (Docs, API, Guides, etc.) - Displayed vertically */}
        <div className="flex flex-col space-y-0.5">
          {/* Main docs tab */}
          <SectionTab to={getProductRoute(product)} isActive={isDocsTabActive} product={product}>
            Docs
          </SectionTab>

          {/* Other section tabs - using orderedSections for proper sorting */}
          {orderedSections.map((s) => (
            <SectionTab
              key={s.slug}
              to={getSectionRoute(product, s.slug)}
              params={getSectionParams(product, s.slug)}
              isActive={currentPath.startsWith(`/docs/${product}/${s.slug}/`)}
              product={product}
            >
              {s.title}
            </SectionTab>
          ))}
        </div>
      </div>

      {/* Border line below section buttons */}
      <div className="pb-4">
        <div
          className={cn(
            "border-b",
            product == "mirascope" ? "border-primary" : "border-emerald-500"
          )}
        ></div>
      </div>

      {/* Scrollable content area with fixed height */}
      <div className="flex flex-col h-[calc(100vh-220px)]">
        <div
          ref={sidebarRef}
          className="flex-1 overflow-y-auto" // Flexbox will allow this to fill available space
        >
          <nav className="space-y-1">
            {matchingSection ? (
              // Show section content if we're in a section path
              <SectionContent
                product={product}
                section={matchingSection}
                isActivePath={isActivePath}
              />
            ) : (
              // Show main docs content if we're not in a section
              <MainDocsContent product={product} isActivePath={isActivePath} />
            )}
          </nav>
        </div>

        {/* Fixed non-scrollable footer buffer */}
        <div className="h-24 flex-shrink-0">
          {/* Empty div to create space between content and footer */}
        </div>
      </div>
    </aside>
  );
};

interface SectionContentProps {
  product: ProductName;
  section: string;
  isActivePath: (path: string) => boolean;
}

// Helper component for rendering nested items (folders)
interface NestedItemsProps {
  items: Record<string, any>;
  product: ProductName;
  basePath: string;
  isActivePath: (path: string) => boolean;
  indentLevel?: number;
}

// Individual nested item component to ensure hooks are consistent
const NestedItem = ({
  itemSlug,
  item,
  product,
  basePath,
  isActivePath,
  indentLevel,
}: {
  itemSlug: string;
  item: any;
  product: ProductName;
  basePath: string;
  isActivePath: (path: string) => boolean;
  indentLevel: number;
}) => {
  // Remove "/index" from the path if present
  const cleanBasePath = basePath.replace(/\/index$/, "");
  // Don't add "index" to the URL path
  const itemUrl = itemSlug === "index" ? cleanBasePath : `${cleanBasePath}/${itemSlug}`;

  // A folder is any item that has nested items
  const hasNestedItems = item.items && Object.keys(item.items).length > 0;

  // Determine if this folder or any of its children are active
  const isActive = isActivePath(itemUrl);

  // State to track if the folder is expanded
  const [isExpanded, setIsExpanded] = React.useState(isActive);

  // Auto-expand if this item or any of its children are active
  React.useEffect(() => {
    if (isActive && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isActive, isExpanded]);

  return (
    <div key={itemSlug}>
      <div className="flex items-center">
        {/* Render expand/collapse icon for folders */}
        {hasNestedItems && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-5 h-5 flex items-center justify-center mr-1 text-muted-foreground"
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              className="stroke-muted-foreground transition-transform"
              style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        )}

        {/* For folders, render a clickable span that toggles expansion */}
        {hasNestedItems ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`py-1 font-medium text-muted-foreground block text-left w-full hover:bg-accent hover:text-accent-foreground rounded-md`}
            style={{
              paddingLeft: `${0.75 + indentLevel * 0.5}rem`,
              paddingRight: "0.75rem",
              flex: 1,
            }}
          >
            {item.title}
          </button>
        ) : (
          /* Render regular items as links */
          <SidebarLink
            to={itemUrl}
            isActive={isActivePath(itemUrl)}
            product={product}
            className={`py-1`}
            style={{
              paddingLeft: `${0.75 + indentLevel * 0.5}rem`,
              paddingRight: "0.75rem",
              flex: 1,
            }}
          >
            {item.title}
          </SidebarLink>
        )}
      </div>

      {/* Render nested items if exists and is expanded */}
      {hasNestedItems && isExpanded && (
        <NestedItems
          items={item.items}
          product={product}
          basePath={itemUrl}
          isActivePath={isActivePath}
          indentLevel={indentLevel + 1}
        />
      )}
    </div>
  );
};

// Container component for a group of nested items
const NestedItems = ({
  items,
  product,
  basePath,
  isActivePath,
  indentLevel = 0,
}: NestedItemsProps) => {
  // Ensure we always have an object, even if items is undefined
  const safeItems = items || {};

  return (
    <div className={`space-y-0.5 mt-1 ${indentLevel > 0 ? "ml-3" : ""}`}>
      {Object.entries(safeItems).map(([itemSlug, item]) => (
        <NestedItem
          key={itemSlug}
          itemSlug={itemSlug}
          item={item}
          product={product}
          basePath={basePath}
          isActivePath={isActivePath}
          indentLevel={indentLevel}
        />
      ))}
    </div>
  );
};

// Renders content for a section (e.g., API)
const SectionContent = ({ product, section, isActivePath }: SectionContentProps) => {
  const sectionData = docsMetadata[product]?.sections?.[section];
  if (!sectionData) return null;

  return (
    <>
      {/* Section top-level items */}
      <NestedItems
        items={sectionData.items || {}}
        product={product}
        basePath={`/docs/${product}/${section}`}
        isActivePath={isActivePath}
      />

      {/* Section groups */}
      {Object.entries(sectionData.groups || {}).map(([groupSlug, group]) => {
        return (
          <div key={groupSlug} className="pt-2">
            {/* Group title - not selectable/highlightable */}
            <GroupTitle title={group.title} product={product} />

            {/* Group items */}
            <NestedItems
              items={group.items || {}}
              product={product}
              basePath={`/docs/${product}/${section}/${groupSlug}`}
              isActivePath={isActivePath}
              indentLevel={1}
            />
          </div>
        );
      })}
    </>
  );
};

interface MainDocsContentProps {
  product: ProductName;
  isActivePath: (path: string) => boolean;
}

// Renders main docs content
const MainDocsContent = ({ product, isActivePath }: MainDocsContentProps) => {
  const productData = docsMetadata[product];
  if (!productData) return null;

  return (
    <>
      {/* Top-level items */}
      <NestedItems
        items={productData.items || {}}
        product={product}
        basePath={`/docs/${product}`}
        isActivePath={isActivePath}
      />

      {/* Top-level groups */}
      {Object.entries(productData.groups || {}).map(([groupSlug, group]) => {
        return (
          <div key={groupSlug} className="pt-2">
            {/* Group title - not selectable/highlightable */}
            <GroupTitle title={group.title} product={product} />

            {/* Group items */}
            <NestedItems
              items={group.items || {}}
              product={product}
              basePath={`/docs/${product}/${groupSlug}`}
              isActivePath={isActivePath}
              indentLevel={1}
            />
          </div>
        );
      })}
    </>
  );
};

export default DocsSidebar;
