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

  // Get the stored consent value
  const storedConsent = localStorage.getItem("cookie-consent");

  // If user has explicitly set a preference, respect it
  if (storedConsent === "accepted") return true;
  if (storedConsent === "rejected") return false;

  // If no preference set, check if user is in EU
  const isEUUser = checkIfUserInEU();

  // Default to opt-out for non-EU users, opt-in for EU users
  return !isEUUser;
};

// Check if the user is in the EU based on Cloudflare country header
export const checkIfUserInEU = (): boolean => {
  if (!isBrowser) return true; // Default to true for SSR

  // EU country codes (including UK for GDPR compliance)
  const euCountryCodes = [
    "AT",
    "BE",
    "BG",
    "HR",
    "CY",
    "CZ",
    "DK",
    "EE",
    "FI",
    "FR",
    "DE",
    "GR",
    "HU",
    "IE",
    "IT",
    "LV",
    "LT",
    "LU",
    "MT",
    "NL",
    "PL",
    "PT",
    "RO",
    "SK",
    "SI",
    "ES",
    "SE",
    "GB",
    "UK",
  ];

  // Get country from meta tag that should be injected server-side
  const countryMetaTag = document.querySelector('meta[name="cf-ipcountry"]');
  const countryCode = countryMetaTag?.getAttribute("content") || "";

  // If no country code is found, assume EU to be conservative
  if (!countryCode) {
    console.log("No country code found from Cloudflare, defaulting to EU user");
    return true;
  }

  return euCountryCodes.includes(countryCode);
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

    // Add error handling for script loading
    script.onerror = () => {
      console.error("Failed to load Google Analytics script");
      analyticsInitialized = false;
    };

    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    // Define the gtag function as it is in the official GA4 snippet
    // @ts-ignore - We need to use arguments here which TS doesn't like
    function gtag() {
      if (!window.dataLayer) {
        console.error("Analytics error: dataLayer is not defined");
        return;
      }
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    // Initialize gtag with proper arguments
    // @ts-ignore - Using arguments in the expected way for GA4
    gtag("js", new Date());

    // Set default consent settings
    // @ts-ignore - Using arguments in the expected way for GA4
    gtag("consent", "default", {
      analytics_storage: "granted", // We only initialize if consent is given
      ad_storage: "denied", // Always deny ad storage by default
    });

    // Initialize with the measurement ID
    // @ts-ignore - Using arguments in the expected way for GA4
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
      // @ts-ignore - Using arguments in the expected way for GA4
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
    // @ts-ignore - Using arguments in the expected way for GA4
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
    // @ts-ignore - Using arguments in the expected way for GA4
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
    // @ts-ignore - Using arguments in the expected way for GA4
    window.gtag("event", "web-vitals", {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(metric.value * 100) / 100,
      non_interaction: true,
      site_version: SITE_VERSION,
    });
  }
};
