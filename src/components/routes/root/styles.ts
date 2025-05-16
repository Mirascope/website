import { cn } from "@/src/lib/utils";

export const DURATION_FAST = 150;
export const DURATION_MEDIUM = 300;
export const DURATION_SLOW = 500;

/**
 * Animation constants for consistent transitions
 */
export const TRANSITION = {
  duration: {
    fast: `duration-${DURATION_FAST}`,
    medium: `duration-${DURATION_MEDIUM}`,
    slow: `duration-${DURATION_SLOW}`,
  },
  timing: {
    default: "ease-in-out",
    bounce: "ease-out",
  },
  properties: {
    all: "transition-all",
    colors: "transition-colors",
    transform: "transition-transform",
    opacity: "transition-opacity",
  },
};

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
    cn(
      "relative z-10 flex items-center flex-shrink-0 mr-2",
      isLandingPage ? "invisible" : "visible"
    ),

  // Right section with controls
  controls: (isSearchOpen: boolean) =>
    cn(
      "flex items-center gap-2 md:gap-3",
      // Use more space when search is open on smaller screens
      isSearchOpen && "flex-grow justify-end"
    ),

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
    TRANSITION.properties.colors,
    TRANSITION.duration.medium,
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
      TRANSITION.properties.colors,
      TRANSITION.duration.medium,
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
      TRANSITION.properties.colors,
      TRANSITION.duration.medium,
      // Interactive states
      "hover:bg-primary/20 focus:bg-primary/20",
      "active:bg-primary/60 active:scale-[0.98]"
    ),
  },
};

/**
 * Mobile menu styles for dropdown navigation
 */
export const MOBILE_MENU_STYLES = {
  // Container for the entire mobile menu
  container: cn(
    // Positioning and layout
    "absolute top-full right-4 z-50 mt-2 max-w-xs md:hidden",
    // Appearance
    "bg-background text-foreground rounded-lg p-6 shadow-lg",
    // Reset text shadow from parent header
    "[text-shadow:none]"
  ),

  // Content container
  content: "flex flex-col space-y-4",

  // Section title (e.g. "Docs")
  sectionTitle: "my-2 text-xl font-medium",

  // Divider between sections
  divider: "my-2",
};

/**
 * Theme switcher component styles
 */
export const THEME_SWITCHER_STYLES = {
  // Button trigger styles
  trigger: cn(
    // Base styles
    "rounded-md p-2 mr-2 cursor-pointer",
    // Transitions
    TRANSITION.properties.colors,
    TRANSITION.duration.medium,
    // Focus state
    "focus:outline-none focus:ring-2 focus:ring-primary",
    // Icon styling from nav (includes default color)
    "nav-icon",
    // Hover color change (similar to nav links)
    "hover:text-primary"
  ),

  // Dropdown content
  content: (isLandingPage: boolean) =>
    cn(
      // Base styling comes from the UI component
      // Apply textured background on landing page
      isLandingPage && "textured-bg-absolute"
    ),

  // Radio items (inherited from dropdown menu component)
  radioItem: cn(
    // Added styles for consistent interaction
    "transition-colors",
    "focus:bg-primary/20 data-[highlighted]:bg-primary/20"
  ),
};

/**
 * Search state styles for coordinated animations
 */
export const SEARCH_STATE_STYLES = {
  closed: {
    container: "w-9 lg:w-36",
    input: "w-0 opacity-0 lg:w-28 lg:pr-3 lg:pl-10 lg:opacity-80",
    icon: "mx-auto lg:absolute lg:left-3",
  },
  open: {
    container: "w-72 max-w-[calc(100vw-120px)] sm:w-80 md:w-[28rem] lg:w-[32rem]", // Responsive width with upper limit
    input: "w-full pr-9 pl-10 opacity-100",
    icon: "absolute left-3",
  },
};

/**
 * Desktop navigation styles
 */
export const DESKTOP_NAV_STYLES = {
  // Container styles
  container: (isSearchOpen: boolean) =>
    cn(
      // Base styles
      "absolute left-1/2 z-20 hidden -translate-x-1/2 transform items-center gap-6 md:flex",
      // Transitions
      "transition-opacity",
      TRANSITION.duration.medium,
      // Visibility based on search state
      isSearchOpen ? "pointer-events-none opacity-0" : "opacity-100"
    ),

  // Menu trigger styles
  menuTrigger: cn(
    // Base styles
    "flex cursor-pointer items-center !bg-transparent p-0 text-xl font-medium",
    // Transitions
    "transition-colors",
    TRANSITION.duration.medium,
    // Interactive states - maintaining transparency
    "hover:!bg-transparent focus:!bg-transparent data-[state=open]:!bg-transparent data-[state=open]:hover:!bg-transparent",
    // Text styling consistent with nav
    "nav-text"
  ),

  // Menu content styles
  menuContent: (isLandingPage: boolean) =>
    cn(
      // Base styles
      "bg-background p-2 [text-shadow:none]",
      // Conditional textured background
      isLandingPage ? "textured-bg-absolute" : ""
    ),

  // Product grid styles
  productGrid: "grid w-[300px] grid-cols-1 gap-2 sm:w-[480px] sm:grid-cols-2",

  // Trigger text container
  triggerText: "px-2 py-2",
};

/**
 * Search bar component styles
 */
export const SEARCH_BAR_STYLES = {
  // Container styles - responsible for overall width
  container: (isOpen: boolean) =>
    cn(
      "search-container",
      "relative flex justify-end lg:justify-start",
      // Add transitions to the container for smooth width changes
      TRANSITION.properties.all,
      TRANSITION.duration.medium,
      TRANSITION.timing.default,
      // Apply all width constraints here as the single source of truth
      isOpen ? "w-72 max-w-[calc(100vw-120px)] sm:w-80 md:w-[28rem] lg:w-[32rem]" : "w-9 lg:w-36",
      // When open on small screens, allow more space
      isOpen && "sm:flex-grow md:flex-grow-0"
    ),

  // Input container styles - matches parent width
  inputContainer: (isLandingPage: boolean) =>
    cn(
      "search-input-container",
      // Base styles
      "h-9 rounded-full relative flex items-center overflow-visible w-full",
      // Transitions
      TRANSITION.properties.all,
      TRANSITION.duration.medium,
      // Conditional styles based on page type
      isLandingPage
        ? "border-0 bg-white/10 hover:bg-white/20"
        : "border-border bg-background/20 hover:bg-primary/10 hover:border-primary/80 border"
    ),

  // Inline styles for input container based on landing page
  getInputContainerStyles: (isLandingPage: boolean) =>
    isLandingPage
      ? { boxShadow: "0 1px 5px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1)" }
      : undefined,

  // Search icon styles
  icon: (isOpen: boolean) =>
    cn(
      // Transitions
      TRANSITION.properties.all,
      TRANSITION.duration.medium,
      // Icon styling
      "nav-icon",
      // Position based on open state
      isOpen ? SEARCH_STATE_STYLES.open.icon : SEARCH_STATE_STYLES.closed.icon
    ),

  // Input field styles
  input: (isOpen: boolean, isLandingPage: boolean) =>
    cn(
      // Base styles
      "cursor-pointer overflow-visible bg-transparent py-0 text-sm leading-normal outline-none",
      "h-auto min-h-full",
      // Transitions
      TRANSITION.properties.all,
      TRANSITION.duration.medium,
      // Text color based on page type
      isLandingPage
        ? "text-white placeholder:text-white/90"
        : "text-foreground placeholder:text-foreground",
      // Visibility and spacing based on open state
      isOpen ? SEARCH_STATE_STYLES.open.input : SEARCH_STATE_STYLES.closed.input
    ),

  // Keyboard shortcut badge
  kbd: (isLandingPage: boolean) =>
    cn(
      "font-small absolute top-1/2 right-3 hidden h-5 -translate-y-1/2 items-center gap-1 rounded border px-1.5 font-mono text-[10px] opacity-80 lg:flex",
      isLandingPage ? "bg-white/10 text-white" : "border-border bg-muted text-foreground"
    ),

  // Results container - matches parent container width
  resultsContainer: (isLandingPage: boolean) =>
    cn(
      // Base styles
      "search-results absolute top-full z-50 mt-2 overflow-hidden rounded-lg shadow-2xl [text-shadow:none]",
      "bg-background border-border border",
      // Transitions
      TRANSITION.properties.opacity,
      TRANSITION.duration.medium,
      // Match width to parent container (container manages actual width constraints)
      "w-full",
      // Responsive positioning
      "right-0 lg:right-auto lg:left-0", // Position from right on small screens, from left on large screens
      // Conditional textured background
      isLandingPage ? "textured-bg-absolute" : ""
    ),

  // Inline styles for results container based on visibility and page type
  getResultsContainerStyles: (isVisible: boolean, isLandingPage: boolean) => {
    const styles = {
      opacity: isVisible ? 1 : 0,
    };

    if (isLandingPage) {
      return {
        ...styles,
        boxShadow: "0 1px 5px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1)",
      };
    }

    return styles;
  },

  // Search result styles
  result: (isSelected: boolean) =>
    cn(
      // Base styles
      "border-border/40 flex border-t px-5 py-4 text-sm first:border-0",
      // Transitions
      TRANSITION.properties.colors,
      TRANSITION.duration.fast,
      // Selected state
      isSelected ? "bg-accent/50" : ""
    ),

  // Search footer styles
  footer:
    "border-border bg-muted/40 text-muted-foreground flex items-center justify-between border-t p-2 text-xs",

  // Loading indicator
  loadingIndicator: "border-primary h-6 w-6 animate-spin rounded-full border-t-2 border-b-2",
};
