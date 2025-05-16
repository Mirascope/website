import { useIsMobile } from "./hooks/useIsMobile";
import SearchBar from "./SearchBar";

interface ResponsiveSearchWrapperProps {
  /**
   * Called when search open state changes
   */
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * Responsive wrapper for search functionality
 * Owns the SearchBar component and handles responsive display
 */
export default function ResponsiveSearchWrapper({ onOpenChange }: ResponsiveSearchWrapperProps) {
  // Use the mobile detection hook
  const isMobile = useIsMobile();

  // Log detection for development verification
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`[SearchWrapper] isMobile: ${isMobile}`);
  }

  // For now, just render the search bar directly
  // Later we'll conditionally render different UIs based on isMobile
  return <SearchBar onOpenChange={onOpenChange} />;
}
