import type { PropsWithChildren } from "react";

interface ResponsiveSearchWrapperProps extends PropsWithChildren {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Responsive wrapper for search functionality
 * Initially just passes through children, but will later
 * conditionally render mobile or desktop versions
 */
export default function ResponsiveSearchWrapper({
  children,
  // These props will be used later once we implement mobile functionality
  isOpen: _isOpen,
  onClose: _onClose,
}: ResponsiveSearchWrapperProps) {
  // Initially, just pass through the children
  return <>{children}</>;
}
