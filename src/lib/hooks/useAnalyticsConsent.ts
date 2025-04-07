import { useState, useEffect } from "react";
import {
  hasAnalyticsConsent,
  updateAnalyticsConsent,
  initializeAnalytics,
} from "../services/analytics";

// Hook to manage analytics consent
export function useAnalyticsConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for existing consent
    const hasConsent = hasAnalyticsConsent();
    setConsent(hasConsent);

    // Initialize analytics with the current consent setting
    if (typeof window !== "undefined") {
      initializeAnalytics();
    }
  }, []);

  // Update consent and handle analytics accordingly
  const updateConsent = (newConsent: boolean) => {
    setConsent(newConsent);
    localStorage.setItem("cookie-consent", newConsent ? "accepted" : "rejected");

    // Update analytics services with new consent setting
    updateAnalyticsConsent(newConsent);
  };

  return {
    hasConsent: consent,
    updateConsent,
  };
}

export default useAnalyticsConsent;
