import { useEffect, useRef, useState } from "react";
import { useRouter } from "@tanstack/react-router";

export interface UseSidebarOptions {
  /**
   * Whether to initialize the sidebar as open
   * @default false
   */
  initialOpen?: boolean;

  /**
   * Whether to close the sidebar when the route changes (typically used on mobile)
   * @default true
   */
  closeOnRouteChange?: boolean;

  /**
   * Function to call when another sidebar opens (to close this one)
   */
  onOtherSidebarOpen?: () => void;

  /**
   * Whether the current viewport is a small screen
   */
  isSmallScreen: boolean;
}

export function useSidebar({
  initialOpen = false,
  closeOnRouteChange = true,
  onOtherSidebarOpen,
  isSmallScreen,
}: UseSidebarOptions) {
  // Track sidebar open state
  const [isOpen, setIsOpen] = useState(initialOpen && !isSmallScreen);

  // Refs for focus management
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Router for navigation tracking
  const router = useRouter();

  // Close on route change (mobile only)
  useEffect(() => {
    if (!closeOnRouteChange) return;

    const unsubscribe = router.subscribe("onResolved", () => {
      if (isSmallScreen && isOpen) {
        setIsOpen(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [router, isSmallScreen, isOpen, closeOnRouteChange]);

  // Handle toggling with focus management
  const toggle = () => {
    // Save the currently focused element when opening
    if (!isOpen) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement;
    }

    const newState = !isOpen;
    setIsOpen(newState);

    // Notify other sidebars when opening
    if (newState && onOtherSidebarOpen) {
      onOtherSidebarOpen();
    }

    // Manage focus
    if (newState) {
      // Focus the close button when sidebar opens
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 100);
    } else {
      // Restore focus when sidebar closes
      setTimeout(() => {
        previouslyFocusedElementRef.current?.focus();
      }, 100);
    }
  };

  // Force open/close functions
  const open = () => {
    if (!isOpen) toggle();
  };

  const close = () => {
    if (isOpen) toggle();
  };

  // Auto-close on ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isSmallScreen && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSmallScreen, isOpen]);

  return {
    isOpen,
    setIsOpen,
    toggle,
    open,
    close,
    closeBtnRef,
    previouslyFocusedElementRef,
  };
}
