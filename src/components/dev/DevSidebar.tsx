import React from "react";
import { Link, useMatches } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

// Hardcoded dev routes for now
const DEV_ROUTES = [
  { path: "/dev", title: "Index" },
  { path: "/dev/audit-metadata", title: "SEO Metadata Audit" },
  { path: "/dev/social-card", title: "Social Card Preview" },
  { path: "/dev/style-test", title: "Style Test Page" },
];

const DevSidebar: React.FC = () => {
  // Get current route from TanStack Router
  const matches = useMatches();
  const currentPath = matches[matches.length - 1]?.pathname || "";

  // Helper function to check if a path matches the current path
  const isActivePath = (path: string) => {
    // Special case for index route
    if (path === "/dev" && (currentPath === "/dev" || currentPath === "/dev/")) {
      return true;
    }
    return currentPath === path;
  };

  return (
    <aside className="h-full pt-6 overflow-hidden">
      <div className="mb-2">
        {/* Section title */}
        <div className="px-3 mb-4">
          <span className="text-xl font-medium">Developer Tools</span>
        </div>

        {/* Border line below title */}
        <div className="pb-4">
          <div className="border-b border-gray-300"></div>
        </div>

        {/* Scrollable content area with fixed height */}
        <div className="flex flex-col h-[calc(100vh-220px)]">
          <div className="flex-1 overflow-y-auto">
            <nav className="space-y-1">
              {DEV_ROUTES.map((route) => (
                <Link
                  key={route.path}
                  to={route.path}
                  className={cn(
                    "block px-3 py-1 text-base rounded-md",
                    isActivePath(route.path)
                      ? "bg-button-primary text-white font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {route.title}
                </Link>
              ))}
            </nav>
          </div>

          {/* Fixed non-scrollable footer buffer */}
          <div className="h-24 flex-shrink-0">
            {/* Empty div to create space between content and footer */}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DevSidebar;
