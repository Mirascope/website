import type { PropsWithChildren } from "react";
import { useIsMobile } from "./hooks/useIsMobile";

interface ResponsiveSearchWrapperProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Responsive wrapper for search functionality
 * Determines whether to show mobile or desktop search UI
 * Initially just passes through children
 */
export default function ResponsiveSearchWrapper({
  children,
  isOpen: _isOpen, // Will use in next phase
  onClose: _onClose, // Will use in next phase
}: ResponsiveSearchWrapperProps) {
  // Use the mobile detection hook
  const isMobile = useIsMobile();

  // Log detection for development verification
  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`[SearchWrapper] isMobile: ${isMobile}`);
  }

  // For now, just pass through the children
  // Later we'll conditionally render different UIs based on isMobile
  return <>{children}</>;
}
