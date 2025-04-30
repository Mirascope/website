import { useState, useEffect, useRef } from "react";
import { isBrowser } from "../lib/services/analytics";
import analyticsManager from "../lib/services/analytics";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

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
    const consent = analyticsManager.getConsent();
    if (consent === "unknown") {
      setIsVisible(true);
    }

    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [isVisible]);

  const handleAccept = () => {
    analyticsManager.updateConsent("accepted");
    setIsVisible(false);
  };

  const handleReject = () => {
    analyticsManager.updateConsent("rejected");
    setIsVisible(false);
  };

  // Don't render anything during SSR or if user has already made a choice
  if (!isVisible) return null;

  return (
    <div
      ref={bannerRef}
      role="alertdialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-description"
      className="xs:bottom-18 bg-background/80 border-primary fixed bottom-18 left-4 z-50 w-[180px] rounded-lg border p-3 shadow-lg backdrop-blur-sm sm:bottom-12 sm:left-4 md:left-4 lg:left-4 xl:bottom-12 2xl:bottom-4"
      tabIndex={-1}
    >
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground font-handwriting text-center text-base">
          <h2 id="cookie-title" className="sr-only">
            Cookie Consent
          </h2>
          <p id="cookie-description">We use cookies to track usage and improve the site.</p>
        </div>
        <div className="flex justify-center gap-2">
          <button
            onClick={handleReject}
            aria-label="Reject cookies"
            className="font-handwriting text-muted-foreground bg-muted hover:bg-accent focus:ring-ring rounded-md px-2 py-1 text-sm font-medium transition-colors focus:ring-2 focus:outline-none"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            aria-label="Accept cookies"
            className="font-handwriting text-primary-foreground bg-primary hover:bg-primary/90 focus:ring-ring rounded-md px-2 py-1 text-sm font-medium transition-colors focus:ring-2 focus:outline-none"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
