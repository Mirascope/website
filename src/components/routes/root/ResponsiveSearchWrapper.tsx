import { useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { useIsMobile } from "./hooks/useIsMobile";
import SearchBar from "./SearchBar";
import { SEARCH_BAR_STYLES } from "./styles";

/**
 * Props for search wrappers
 */
interface SearchWrapperProps {
  /**
   * Called when search open state changes
   */
  onOpenChange: (isOpen: boolean) => void;
}

/**
 * Mobile-specific search UI with overlay
 */
function MobileSearchWrapper({ onOpenChange }: SearchWrapperProps) {
  // Manage internal state for mobile search
  const [isOpen, setIsOpen] = useState(false);

  // Open mobile search handler
  const handleOpenSearch = () => {
    setIsOpen(true);
    onOpenChange(true);
  };

  // Close mobile search handler
  const handleCloseSearch = () => {
    setIsOpen(false);
    onOpenChange(false);
  };

  // Handle search state changes from SearchBar
  const handleSearchOpenChange = (open: boolean) => {
    if (!open) {
      // Only handle close events from SearchBar
      handleCloseSearch();
    }
  };

  return (
    <>
      {/* Mobile search button (only shown when search is closed) */}
      {!isOpen && (
        <button
          className={SEARCH_BAR_STYLES.mobileSearchButton}
          onClick={handleOpenSearch}
          aria-label="Open search"
        >
          <SearchIcon size={16} />
        </button>
      )}

      {/* Mobile search overlay */}
      <div className={SEARCH_BAR_STYLES.mobileOverlay(isOpen)}>
        <div className={SEARCH_BAR_STYLES.mobileSearchContainer}>
          {/* Close button */}
          <button
            className={SEARCH_BAR_STYLES.closeButton}
            onClick={handleCloseSearch}
            aria-label="Close search"
          >
            <X size={20} />
          </button>

          {/* SearchBar in the overlay */}
          <div className="flex-grow">
            <SearchBar
              onOpenChange={handleSearchOpenChange}
              isMobile={true}
              initialIsOpen={true} // Force it to start in open state
            />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Responsive wrapper that renders either mobile or desktop search UI
 * based on screen size
 */
export default function ResponsiveSearchWrapper({ onOpenChange }: SearchWrapperProps) {
  // Use the mobile detection hook
  const isMobile = useIsMobile();

  // Choose the appropriate UI based on screen size
  if (isMobile) {
    return <MobileSearchWrapper onOpenChange={onOpenChange} />;
  }

  // Desktop UI - render the SearchBar normally
  return <SearchBar onOpenChange={onOpenChange} />;
}
