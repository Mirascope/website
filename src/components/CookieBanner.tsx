import { useState, useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { isBrowser } from "../lib/services/analytics";
import analyticsManager from "../lib/services/analytics";
import { cn } from "../lib/utils";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const router = useRouterState();
  const isLandingPage = router.location.pathname === "/";

  useEffect(() => {
    // Only run in browser environment
    if (!isBrowser) return;

    // Check if user has already made a choice
    const consent = analyticsManager.getConsent();
    if (consent === "unknown") {
      setIsVisible(true);
    }
  }, []);

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
      className={cn(
        "fixed bottom-18 left-4 z-50 w-[180px] rounded-lg border p-3 shadow-lg backdrop-blur-sm",
        "xs:bottom-18 sm:bottom-12 sm:left-4 md:left-4 lg:left-4 xl:bottom-12 2xl:bottom-4",
        "border-border",
        isLandingPage ? "bg-background/40" : "bg-background/80"
      )}
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
            className={cn(
              "rounded-md px-2 py-1 text-sm font-medium transition-colors focus:ring-2 focus:outline-none",
              "font-handwriting text-muted-foreground",
              "hover:bg-accent focus:ring-ring",
              isLandingPage ? "bg-muted/70" : "bg-muted"
            )}
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            aria-label="Accept cookies"
            className={cn(
              "rounded-md px-2 py-1 text-sm font-medium transition-colors focus:ring-2 focus:outline-none",
              "font-handwriting text-primary-foreground",
              "hover:bg-primary/90 focus:ring-ring",
              isLandingPage ? "bg-primary/70" : "bg-primary"
            )}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
