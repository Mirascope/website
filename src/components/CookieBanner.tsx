import { useState, useEffect } from "react";
import { isBrowser } from "../lib/services/analytics";

interface CookieBannerProps {
  onAccept: () => void;
  onReject: () => void;
}

export default function CookieBanner({ onAccept, onReject }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run in browser environment
    if (!isBrowser) return;

    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem("cookie-consent");
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          We use cookies to improve your experience on our site. You can accept all cookies or
          customize your preferences.
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Reject All
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
