/**
 * Analytics service to handle all tracking functionality.
 * Integrated with Google Analytics 4.
 */
import { GA_MEASUREMENT_ID, SITE_VERSION } from "../constants/site";

// Centralized check for browser environment
export const isBrowser = typeof window !== "undefined";

// Check if analytics consent has been given
export const hasAnalyticsConsent = (): boolean => {
  if (!isBrowser) return false;

  // Disable analytics in development environment
  if (process.env.NODE_ENV === "development") {
    return false;
  }

  return localStorage.getItem("cookie-consent") === "accepted";
};

// Analytics script status tracking
let analyticsInitialized = false;

// Initialize analytics with proper consent settings
export const initializeAnalytics = (): void => {
  if (!isBrowser) return;

  const hasConsent = hasAnalyticsConsent();

  // Skip initialization if no consent
  if (!hasConsent) {
    console.log("Analytics not initialized: user consent not given");
    return;
  }

  // Prevent duplicate initialization
  if (analyticsInitialized) {
    console.log("Analytics already initialized");
    return;
  }

  analyticsInitialized = true;
  console.log(`Analytics initialized with consent: ${hasConsent}`);

  // Add the Google Analytics script dynamically
  if (!document.getElementById("ga-script")) {
    const script = document.createElement("script");
    script.id = "ga-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer?.push(args);
    }
    window.gtag = gtag;
    gtag("js", new Date());

    // Set default consent settings
    gtag("consent", "default", {
      analytics_storage: "granted", // We only initialize if consent is given
      ad_storage: "denied", // Always deny ad storage by default
    });

    // Initialize with the measurement ID
    gtag("config", GA_MEASUREMENT_ID, {
      anonymize_ip: true,
      send_page_view: true,
      site_version: SITE_VERSION, // Track site version as a custom dimension
    });
  }
};

// Update consent settings in analytics platforms
export const updateAnalyticsConsent = (consent: boolean): void => {
  if (!isBrowser) return;

  // Store consent in localStorage
  localStorage.setItem("cookie-consent", consent ? "accepted" : "rejected");

  console.log(`Analytics consent updated: ${consent}`);

  if (consent) {
    // Initialize analytics if consent is granted
    initializeAnalytics();
  } else {
    // Handle revoking consent
    analyticsInitialized = false;

    // Update Google Analytics consent settings if already loaded
    if (window.gtag) {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      });
    }
  }
};

// Track a page view
export const trackPageView = (path: string): void => {
  if (!isBrowser || !hasAnalyticsConsent() || !analyticsInitialized) return;

  console.log(`Page view tracked: ${path}`);

  // Send pageview to Google Analytics
  if (window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: path,
    });
  }
};

// Track a custom event
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number
): void => {
  if (!isBrowser || !hasAnalyticsConsent() || !analyticsInitialized) return;

  console.log(`Event tracked: ${category} - ${action} - ${label} - ${value}`);

  // Send event to Google Analytics
  if (window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
      site_version: SITE_VERSION, // Include site version in all events
    });
  }
};

// Web vitals reporting function that respects consent
export const reportWebVitalsToAnalytics = (metric: any): void => {
  if (!isBrowser || !hasAnalyticsConsent() || !analyticsInitialized) return;

  console.log(`Web vital reported: ${metric.name} - ${Math.round(metric.value * 100) / 100}`);

  // Send web vitals to Google Analytics
  if (window.gtag) {
    window.gtag("event", "web-vitals", {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(metric.value * 100) / 100,
      non_interaction: true,
      site_version: SITE_VERSION,
    });
  }
};
