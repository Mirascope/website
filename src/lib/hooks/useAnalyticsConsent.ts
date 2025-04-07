import { useState, useEffect } from "react";
import {
  hasAnalyticsConsent,
  updateAnalyticsConsent,
  initializeAnalytics,
  isBrowser,
} from "../services/analytics";
import { SITE_VERSION } from "../constants/site";

// Hook to manage analytics consent
export function useAnalyticsConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isBrowser) return;

    // Check for existing consent
    const hasConsent = hasAnalyticsConsent();
    setConsent(hasConsent);

    // Initialize analytics with the current consent setting
    initializeAnalytics();

    // Log debug information in development
    if (process.env.NODE_ENV === "development") {
      console.log(`Site Version: ${SITE_VERSION}`);
      console.log("Analytics tracking disabled in development environment");
    }
  }, []);

  // Update consent and handle analytics accordingly
  const updateConsent = (newConsent: boolean) => {
    setConsent(newConsent);

    // Update analytics services with new consent setting
    // (This function handles localStorage updates internally)
    updateAnalyticsConsent(newConsent);
  };

  return {
    hasConsent: consent,
    updateConsent,
  };
}

export default useAnalyticsConsent;
