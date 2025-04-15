/**
 * Analytics service to handle all tracking functionality.
 * Integrated with Google Analytics 4.
 */
import { GA_MEASUREMENT_ID, SITE_VERSION } from "../constants/site";

// Centralized check for browser environment
export const isBrowser = typeof window !== "undefined";

export type AnalyticsConsent = "accepted" | "rejected" | "unknown";

type EventParams = {
  event_category?: string;
  event_label?: string;
  value?: number;
  non_interaction?: boolean;
  site_version?: string;
  page_path?: string;
  [key: string]: any; // Allow additional custom parameters
};

/**
 * AnalyticsManager class to centralize all analytics functionality
 * including consent management, initialization, and tracking.
 */
export class AnalyticsManager {
  private initialized = false;
  private measurmentId: string;
  private siteVersion: string;

  constructor(measurmentId: string = GA_MEASUREMENT_ID, siteVersion: string = SITE_VERSION) {
    this.measurmentId = measurmentId;
    this.siteVersion = siteVersion;
  }

  /**
   * Get the current analytics consent state
   */
  getConsent(): AnalyticsConsent {
    if (!isBrowser) return "unknown";

    const storedConsent = localStorage.getItem("cookie-consent");
    if (storedConsent === "accepted") return "accepted";
    if (storedConsent === "rejected") return "rejected";
    return "unknown";
  }

  /**
   * Update the user's consent preference
   */
  updateConsent(consent: AnalyticsConsent): void {
    if (!isBrowser) return;

    // Store consent in localStorage
    localStorage.setItem("cookie-consent", consent);
    console.log(`Analytics consent updated: ${consent}`);

    if (consent === "accepted") {
      // Initialize analytics if consent is granted
      this.enableAnalytics();
    } else if (consent === "rejected") {
      // Handle revoking consent
      this.disableAnalytics();
    }
    // "unknown" state doesn't change current analytics state
  }

  /**
   * Check if analytics should be enabled based on consent and location
   */
  isEnabled(): boolean {
    if (!isBrowser) return false;

    // Disable analytics in development environment
    if (process.env.NODE_ENV === "development") {
      return false;
    }

    const consent = this.getConsent();

    // If user has explicitly set a preference, respect it
    if (consent === "accepted") return true;
    if (consent === "rejected") return false;

    // For unknown consent, check location
    if (this.isUserInEU()) {
      // Default to false for EU users to respect GDPR
      return false;
    } else {
      // Use analytics by default where permissible
      return true;
    }
  }

  /**
   * Enable analytics - initializes if needed
   */
  enableAnalytics(): boolean {
    if (!this.isEnabled()) return false;

    this.initialize();
    return true;
  }

  /**
   * Disable analytics and update consent settings if already loaded
   */
  disableAnalytics(): void {
    this.initialized = false;

    // Update Google Analytics consent settings if already loaded
    if (window.gtag) {
      // @ts-ignore - Using arguments in the expected way for GA4
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      });
    }
  }

  /**
   * Check if the user is in the EU based on Cloudflare country header
   */
  isUserInEU(): boolean {
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
  }

  /**
   * Initialize Google Analytics
   */
  private initialize(): void {
    // Prevent duplicate initialization
    if (this.initialized) {
      console.log("Analytics already initialized");
      return;
    }

    console.log(`Analytics initializing`);

    // Add the Google Analytics script dynamically
    if (!document.getElementById("ga-script")) {
      const script = document.createElement("script");
      script.id = "ga-script";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurmentId}`;

      // Add error handling for script loading
      script.onerror = () => {
        console.error("Failed to load Google Analytics script");
        this.initialized = false;
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
      gtag("config", this.measurmentId, {
        anonymize_ip: true,
        send_page_view: true,
        site_version: this.siteVersion,
      });

      this.initialized = true;
      console.log(`Analytics initialized`);
    }
  }

  /**
   * Track a page view
   */
  trackPageView(path: string): void {
    if (!this.enableAnalytics()) return;

    // Send pageview to Google Analytics
    if (window.gtag) {
      // @ts-ignore - Using arguments in the expected way for GA4
      window.gtag("config", this.measurmentId, {
        page_path: path,
      });
    }
  }

  /**
   * Track a custom event
   */
  trackEvent(action: string, params: EventParams = {}): void {
    if (!this.enableAnalytics()) return;

    // Add site version to all events
    const eventParams = {
      ...params,
      site_version: this.siteVersion,
    };

    console.log(`Event tracked: ${action}`, eventParams);

    // Send event to Google Analytics
    if (window.gtag) {
      // @ts-ignore - Using arguments in the expected way for GA4
      window.gtag("event", action, eventParams);
    }
  }

  /**
   * Report web vitals metrics
   */
  reportWebVital(metric: any): void {
    if (!this.enableAnalytics()) return;

    console.log(`Web vital reported: ${metric.name} - ${Math.round(metric.value * 100) / 100}`);

    this.trackEvent("web-vitals", {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(metric.value * 100) / 100,
      non_interaction: true,
    });
  }
}

// Create a singleton instance for the application to use
export const analyticsManager = new AnalyticsManager();

// Export just the manager instance
export default analyticsManager;
