import React from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/src/lib/utils";
import { PRODUCT_CONFIGS } from "@/src/lib/constants/site";
import type { ProductName } from "@/src/lib/content/spec";

/**
 * Format star count with appropriate suffix
 */
function formatStarCount(count: number): string {
  if (count >= 1000) {
    // Format thousands with single decimal point
    const formatted = (count / 1000).toFixed(1);
    // Remove trailing .0 if present
    return `${formatted.endsWith(".0") ? formatted.slice(0, -2) : formatted}k`;
  }
  // Just return the number for smaller counts
  return count.toString();
}

interface GitHubRepoButtonProps {
  className?: string;
}

const GitHubRepoButton: React.FC<GitHubRepoButtonProps> = ({ className }) => {
  const router = useRouterState();
  const isLandingPage = router.location.pathname === "/";

  // Determine which product repo to show based on the current route
  let currentProduct: ProductName = "mirascope"; // Default to mirascope

  // Check if we're in a product-specific route
  const path = router.location.pathname;
  if (path.startsWith("/docs/lilypad")) {
    currentProduct = "lilypad";
  }

  const productConfig = PRODUCT_CONFIGS[currentProduct];

  if (!productConfig?.github) {
    return null;
  }

  const { repo, stars, version } = productConfig.github;

  // GitHub icon
  const GitHubIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );

  return (
    <a
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex flex-col py-1 px-2 transition-colors duration-200",
        isLandingPage
          ? "text-white hover:text-primary"
          : "text-foreground hover:text-muted-foreground",
        className
      )}
    >
      {/* GitHub icon and product name */}
      <div className="flex items-center gap-1 font-medium text-base">
        {GitHubIcon}
        <span>{currentProduct}</span>
      </div>

      {/* Stats on second line */}
      <div className="flex items-center gap-2 text-xs mt-0.5 opacity-80">
        {/* Version tag */}
        {version && (
          <div className="flex items-center gap-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            {version}
          </div>
        )}

        {/* Star count */}
        {stars && (
          <div className="flex items-center gap-0.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            {formatStarCount(stars)}
          </div>
        )}
      </div>
    </a>
  );
};

export default GitHubRepoButton;
