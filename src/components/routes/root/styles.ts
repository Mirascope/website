import { cn } from "@/src/lib/utils";

/**
 * Shared navigation link styles for desktop and mobile
 */
export const NAV_LINK_STYLES = {
  // Base styles for desktop navigation links
  base: "relative flex cursor-pointer items-center px-2 py-2 text-xl font-medium nav-text",

  // Styles for mobile navigation links
  mobile:
    "hover:text-primary relative flex cursor-pointer items-center py-2 text-xl font-medium transition-colors duration-200",
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
      "hover:bg-muted"
    ),
  },
};
