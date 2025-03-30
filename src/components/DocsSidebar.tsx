import React from "react";
import { Link, useMatches } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import docsMetadata from "@/docs/_meta";
import { getSectionsForProduct } from "@/lib/docs";

/**
 * DocsSidebar component - Renders navigation based on _meta.ts structure
 */
const DocsSidebar = ({ 
  product = "", 
  section = null,
  currentSlug = "",
  currentGroup = null 
}) => {
  // Get current route from TanStack Router
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.pathname || "";
  const currentParams = matches[matches.length - 1]?.params || {};
  
  // Log useful debugging info
  console.log("Current path in sidebar:", currentPath);
  console.log("Route params:", currentParams);
  console.log("Props received:", { product, section, currentSlug, currentGroup });
  
  // Get metadata for this product
  const productData = docsMetadata[product];
  const sections = getSectionsForProduct(product);
  
  // Check if the current path includes a top-level group
  const topLevelGroups = Object.keys(productData?.groups || {});
  const matchingGroup = topLevelGroups.find(group => currentPath.includes(`/docs/${product}/${group}/`));
  
  console.log("Available top-level groups:", topLevelGroups);
  console.log("Matching group from path:", matchingGroup);
  
  if (!productData) return <div>Product not found</div>;

  // Is the main "Docs" tab active?
  // The Docs tab is active when:
  // 1. We're not in a specific section, OR
  // 2. We're looking at a top-level item, OR
  // 3. We're in a path that includes a top-level group
  
  // Simple rule: If we're in any URL with a section from _meta.ts, 
  // then we're not in "Docs" tab. Otherwise, we're in "Docs" tab.
  
  // Get all sections from _meta.ts
  const allSections = Object.keys(productData?.sections || {});
  
  // Check if the current URL contains any of the sections from _meta.ts
  const matchingSection = allSections.find(s => 
    currentPath.startsWith(`/docs/${product}/${s}/`)
  );
  
  // Docs tab is active only if we're not in a section
  const isDocsTabActive = !matchingSection;
  
  // Helper function to check if a path matches the current path
  const isActivePath = (path) => {
    // Normalize paths by ensuring they end with a slash
    const normalizedPath = path.endsWith('/') ? path : `${path}/`;
    const normalizedCurrentPath = currentPath.endsWith('/') ? currentPath : `${currentPath}/`;
    
    // Special case for product landing - both /docs/product and /docs/product/ should match
    if (path === `/docs/${product}` && 
       (currentPath === `/docs/${product}` || currentPath === `/docs/${product}/`)) {
      return true;
    }
    
    // Special case for group index pages - check if we're viewing any page in this group
    if (path.includes(`/${currentGroup}/`) && currentGroup) {
      if (normalizedCurrentPath.startsWith(normalizedPath)) {
        return true;
      }
    }
    
    // Direct path match
    return currentPath === path || normalizedCurrentPath === normalizedPath;
  };
  
  return (
    <aside className="h-full pt-6 pb-12">
      <div className="px-4 mb-6">
        {/* Product selector */}
        <div className="flex mb-5 space-x-4">
          {product === "mirascope" ? (
            <span className="text-xl font-medium text-mirascope-purple">Mirascope</span>
          ) : (
            <Link to="/docs/mirascope" className="text-xl font-medium text-gray-400 hover:text-gray-700">
              Mirascope
            </Link>
          )}
          
          {product === "lilypad" ? (
            <span className="text-xl font-medium text-lilypad-green">Lilypad</span>
          ) : (
            <Link to="/docs/lilypad" className="text-xl font-medium text-gray-400 hover:text-gray-700">
              Lilypad
            </Link>
          )}
        </div>

        {/* Section tabs (Docs, API, etc.) */}
        <div className="flex space-x-1 mb-6 flex-wrap">
          {/* Main docs tab */}
          <Link
            to={`/docs/${product}`}
            className={cn(
              "px-3 py-1.5 text-base rounded-md mb-1",
              isDocsTabActive
                ? product === "mirascope"
                  ? "bg-mirascope-purple text-white"
                  : "bg-lilypad-green text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            Docs
          </Link>

          {/* Other section tabs */}
          {sections.map((s) => (
            <Link
              key={s.slug}
              to={`/docs/${product}/${s.slug}/`}
              className={cn(
                "px-3 py-1.5 text-base rounded-md mb-1",
                // Section tab is active if we're in this section's URL path
                currentPath.startsWith(`/docs/${product}/${s.slug}/`)
                  ? product === "mirascope"
                    ? "bg-mirascope-purple text-white"
                    : "bg-lilypad-green text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {s.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-3">
        <nav className="space-y-3">
          {matchingSection ? (
            // Show section content if we're in a section path
            <SectionContent 
              product={product} 
              section={matchingSection} 
              isActivePath={isActivePath}
              currentPath={currentPath}
              currentGroup={currentGroup}
            />
          ) : (
            // Show main docs content if we're not in a section
            <MainDocsContent 
              product={product} 
              isActivePath={isActivePath}
              currentPath={currentPath}
              currentGroup={currentGroup}
            />
          )}
        </nav>
      </div>
    </aside>
  );
};

// Renders content for a section (e.g., API)
const SectionContent = ({ product, section, isActivePath, currentPath, currentGroup }) => {
  const sectionData = docsMetadata[product]?.sections?.[section];
  if (!sectionData) return null;

  return (
    <>
      {/* Section top-level items */}
      {Object.entries(sectionData.items || {}).map(([slug, item]) => {
        const url = slug === "index" 
          ? `/docs/${product}/${section}/` 
          : `/docs/${product}/${section}/${slug}`;
          
        return (
          <Link
            key={slug}
            to={url}
            className={cn(
              "block pl-2 pr-3 py-2 text-base rounded-md",
              isActivePath(url)
                ? product === "mirascope"
                  ? "bg-gray-100 text-mirascope-purple font-medium"
                  : "bg-gray-100 text-lilypad-green font-medium"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {item.title}
          </Link>
        );
      })}

      {/* Section groups */}
      {Object.entries(sectionData.groups || {}).map(([groupSlug, group]) => {
        const groupUrl = `/docs/${product}/${section}/${groupSlug}/`;
        
        return (
          <div key={groupSlug} className="pt-4">
            {/* Group title - not selectable/highlightable */}
            <div className="font-semibold pl-2 pr-3 py-1 block text-gray-900 cursor-default">
              {group.title}
            </div>
            
            {/* Group items */}
            <div className="space-y-1 mt-2">
              {Object.entries(group.items || {}).map(([itemSlug, item]) => {
                const itemUrl = `/docs/${product}/${section}/${groupSlug}/${itemSlug}`;
                
                return (
                  <Link
                    key={itemSlug}
                    to={itemUrl}
                    className={cn(
                      "block pl-4 pr-3 py-2 text-base rounded-md",
                      isActivePath(itemUrl)
                        ? product === "mirascope"
                          ? "bg-gray-100 text-mirascope-purple font-medium"
                          : "bg-gray-100 text-lilypad-green font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};

// Renders main docs content
const MainDocsContent = ({ product, isActivePath, currentPath, currentGroup }) => {
  const productData = docsMetadata[product];
  if (!productData) return null;

  return (
    <>
      {/* Top-level items */}
      {Object.entries(productData.items || {}).map(([slug, item]) => {
        const url = slug === "index" 
          ? `/docs/${product}` 
          : `/docs/${product}/${slug}`;
          
        return (
          <Link
            key={slug}
            to={url}
            className={cn(
              "block pl-2 pr-3 py-2 text-base rounded-md",
              isActivePath(url)
                ? product === "mirascope"
                  ? "bg-gray-100 text-mirascope-purple font-medium"
                  : "bg-gray-100 text-lilypad-green font-medium"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {item.title}
          </Link>
        );
      })}

      {/* Top-level groups */}
      {Object.entries(productData.groups || {}).map(([groupSlug, group]) => {
        const groupUrl = `/docs/${product}/${groupSlug}/`;
        
        return (
          <div key={groupSlug} className="pt-4">
            {/* Group title - not selectable/highlightable */}
            <div className="font-semibold pl-2 pr-3 py-1 block text-gray-900 cursor-default">
              {group.title}
            </div>
            
            {/* Group items */}
            <div className="space-y-1 mt-2">
              {Object.entries(group.items || {}).map(([itemSlug, item]) => {
                const itemUrl = `/docs/${product}/${groupSlug}/${itemSlug}`;
                
                return (
                  <Link
                    key={itemSlug}
                    to={itemUrl}
                    className={cn(
                      "block pl-4 pr-3 py-2 text-base rounded-md",
                      isActivePath(itemUrl)
                        ? product === "mirascope"
                          ? "bg-gray-100 text-mirascope-purple font-medium"
                          : "bg-gray-100 text-lilypad-green font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default DocsSidebar;