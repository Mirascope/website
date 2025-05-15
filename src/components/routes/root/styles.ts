import { cn } from "@/src/lib/utils";

/**
 * Header styles for main site header
 */
export const HEADER_STYLES = {
  // Container styles for the header with conditional appearance based on landing page and scroll
  container: (isLandingPage: boolean, scrolled: boolean) =>
    cn(
      // Fixed positioning and layout
      "fixed top-0 right-0 left-0 z-50 mb-2 flex w-full flex-col items-center justify-center px-4 py-2 sm:px-6",
      // Text styling for landing page
      "landing-text landing-page-text-shadow",
      // Background color (only on non-landing pages)
      isLandingPage ? "" : "bg-background",
      // Bottom border and shadow when scrolled (only on non-landing pages)
      scrolled && !isLandingPage ? "border-border border-b shadow-sm" : ""
    ),

  // Navigation container
  nav: "mx-auto flex w-full max-w-7xl flex-row items-center justify-between",

  // Logo link container
  logo: (isLandingPage: boolean) =>
    cn("relative z-10 flex items-center", isLandingPage ? "invisible" : "visible"),

  // Right section with controls
  controls: "flex items-center gap-2 md:gap-3",

  // GitHub button container
  githubContainer: "hidden items-center gap-3 md:flex",

  // Mobile menu toggle button
  menuButton: () => cn("p-2 md:hidden", "nav-icon"),

  // Product selector container
  productSelector: "mx-auto flex w-full max-w-7xl pt-3 pb-1",
};

/**
 * Shared navigation link styles for desktop and mobile
 */
export const NAV_LINK_STYLES = {
  // Base styles for desktop navigation links
  base: cn(
    // Layout and typography
    "relative flex cursor-pointer items-center px-2 py-2 text-xl font-medium",
    // Uses the nav-text utility for consistent text styling based on page type
    "nav-text"
  ),

  // Styles for mobile navigation links
  mobile: cn(
    // Base styles
    "relative flex cursor-pointer items-center py-2 text-xl font-medium",
    // Transitions
    "transition-colors duration-200",
    // Interactive states
    "hover:text-primary"
  ),
};

/**
 * Product card/link styles for both desktop and mobile
 */
export const PRODUCT_LINK_STYLES = {
  // Desktop product card styles in dropdown menu
  desktop: {
    container: cn(
      // Base styles
      "bg-background block space-y-1.5 rounded-md p-4",
      // Transition properties
      "transition-colors",
      // Interactive states
      "hover:bg-primary/20 focus:bg-primary/20",
      "active:bg-primary/60 active:scale-[0.98]",
      // Selected state via data attribute
      "data-[active=true]:bg-primary/50 data-[active=true]:hover:bg-primary/60"
    ),
    title: "text-primary text-xl font-medium",
    description: "text-foreground text-base",
  },

  // Mobile product link styles
  mobile: {
    container: cn(
      // Base styles
      "bg-background text-primary rounded-md p-3 font-medium",
      // Transitions
      "transition-colors",
      // Interactive states
      "hover:bg-primary/20 focus:bg-primary/20",
      "active:bg-primary/60 active:scale-[0.98]"
    ),
  },
};
