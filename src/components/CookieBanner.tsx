import { useState, useEffect, useRef } from "react";
import { isBrowser } from "../lib/services/analytics";

interface CookieBannerProps {
  onAccept: () => void;
  onReject: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export default function CookieBanner({
  onAccept,
  onReject,
  onVisibilityChange,
}: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Notify parent when visibility changes
  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(isVisible);
    }
  }, [isVisible, onVisibilityChange]);

  useEffect(() => {
    // Only run in browser environment
    if (!isBrowser) return;

    // Add escape key handler
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        handleReject();
      }
    };

    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem("cookie-consent");
    if (!cookieConsent) {
      setIsVisible(true);
    }

    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [isVisible]);

  const handleAccept = () => {
    // Only attempt to use localStorage in browser
    if (isBrowser) {
      localStorage.setItem("cookie-consent", "accepted");
    }
    setIsVisible(false);
    onAccept();
  };

  const handleReject = () => {
    // Only attempt to use localStorage in browser
    if (isBrowser) {
      localStorage.setItem("cookie-consent", "rejected");
    }
    setIsVisible(false);
    onReject();
  };

  // Don't render anything during SSR or if user has already made a choice
  if (!isVisible) return null;

  return (
    <div
      ref={bannerRef}
      role="alertdialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-description"
      className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg w-full"
      tabIndex={-1}
    >
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <h2 id="cookie-title" className="sr-only">
            Cookie Consent
          </h2>
          <p id="cookie-description">
            We use cookies to track usage and improve the site. You can accept or reject these
            cookies.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            aria-label="Reject cookies"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            aria-label="Accept cookies"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
