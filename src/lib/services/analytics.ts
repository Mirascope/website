/**
 * Analytics service to handle all tracking functionality.
 * Integrated with Google Analytics 4 and PostHog.
 */
import { GA_MEASUREMENT_ID, GTM_ID, POSTHOG_PUBLIC_KEY, SITE_VERSION } from "../constants/site";

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
  private gaInitialized = false;
  private phInitialized = false;
  private gaMeasurementId: string;
  private gtmId: string;
  private posthogApiKey: string;
  private siteVersion: string;

  constructor(
    gaMeasurementId: string = GA_MEASUREMENT_ID,
    gtmId: string = GTM_ID,
    posthogApiKey: string = POSTHOG_PUBLIC_KEY,
    siteVersion: string = SITE_VERSION
  ) {
    this.gaMeasurementId = gaMeasurementId;
    this.gtmId = gtmId;
    this.posthogApiKey = posthogApiKey;
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
  async updateConsent(consent: AnalyticsConsent): Promise<void> {
    if (!isBrowser) return;

    // Store consent in localStorage
    localStorage.setItem("cookie-consent", consent);
    console.log(`Analytics consent updated: ${consent}`);

    if (consent === "accepted") {
      // Initialize analytics if consent is granted
      await this.enableAnalytics();
    } else if (consent === "rejected") {
      // Handle revoking consent
      this.disableAnalytics();
    }
    // "unknown" state doesn't change current analytics state
  }

  /**
   * Check if analytics should be enabled based on consent and location
   */
  async isEnabled(): Promise<boolean> {
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
    if (await this.isUserInEU()) {
      // Default to false for EU users to respect GDPR
      return false;
    } else {
      // Use analytics by default where permissible
      return true;
    }
  }

  /**
   * Enable analytics - initializes both analytics providers if needed
   */
  async enableAnalytics(): Promise<boolean> {
    if (!(await this.isEnabled())) return false;

    this.initializeGoogleAnalytics();
    this.initializePostHog();
    return true;
  }

  /**
   * Disable analytics and update consent settings if already loaded
   */
  disableAnalytics(): void {
    this.gaInitialized = false;
    this.phInitialized = false;

    // Update Google Analytics consent settings if already loaded
    if (window.gtag) {
      // @ts-ignore - Using arguments in the expected way for GA4
      window.gtag("consent", "update", {
        analytics_storage: "denied",
      });

      // This will also affect GTM since they share the same dataLayer
      window.dataLayer?.push({ "gtm.consent": "denied" });
    }

    // Opt out of PostHog tracking if loaded
    if (window.posthog) {
      window.posthog.opt_out_capturing();
    }
  }

  /**
   * Check if the user is in the EU based on Cloudflare country header
   */
  async isUserInEU(): Promise<boolean> {
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
   * Initialize Google Analytics and Google Tag Manager
   */
  private initializeGoogleAnalytics(): void {
    // Prevent duplicate initialization
    if (this.gaInitialized) {
      console.log("Google Analytics already initialized");
      return;
    }

    console.log(`Google Analytics and Tag Manager initializing`);

    // Initialize dataLayer for both GA4 and GTM
    window.dataLayer = window.dataLayer || [];

    // Initialize Google Tag Manager
    if (!document.getElementById("gtm-script")) {
      try {
        // Add GTM script to head
        const gtmScript = document.createElement("script");
        gtmScript.id = "gtm-script";
        gtmScript.innerHTML = `
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${this.gtmId}');
        `;
        document.head.appendChild(gtmScript);
        console.log(`Google Tag Manager script added`);
      } catch (error) {
        console.error("Failed to load Google Tag Manager script:", error);
      }
    }

    // Add the Google Analytics script dynamically
    if (!document.getElementById("ga-script")) {
      const script = document.createElement("script");
      script.id = "ga-script";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaMeasurementId}`;

      // Add error handling for script loading
      script.onerror = () => {
        console.error("Failed to load Google Analytics script");
        this.gaInitialized = false;
      };

      document.head.appendChild(script);

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
      gtag("config", this.gaMeasurementId, {
        anonymize_ip: true,
        send_page_view: true,
        site_version: this.siteVersion,
      });

      this.gaInitialized = true;
      console.log(`Google Analytics initialized`);
    }
  }

  /**
   * Initialize PostHog
   */
  private initializePostHog(): void {
    // Prevent duplicate initialization
    if (this.phInitialized) {
      console.log("PostHog already initialized");
      return;
    }

    console.log(`PostHog initializing`);

    // Add the PostHog script dynamically
    if (!document.getElementById("posthog-script")) {
      try {
        // Create and configure the script element
        const script = document.createElement("script");
        script.id = "posthog-script";
        script.type = "text/javascript";
        script.crossOrigin = "anonymous";
        script.async = true;

        // Add PostHog initialization code inline
        script.innerHTML = `
          !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init bs ws ge fs capture De calculateEventProperties $s register register_once register_for_session unregister unregister_for_session Is getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey canRenderSurveyAsync identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty xs Ss createPersonProfile Es gs opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing ys debug ks getPageViewId captureTraceFeedback captureTraceMetric".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
          posthog.init('${this.posthogApiKey}', {
            api_host: 'https://us.i.posthog.com',
            person_profiles: 'identified_only',
            capture_pageview: true,
            capture_pageleave: true,
            autocapture: true
          });
        `;

        // Append the script to the document
        document.head.appendChild(script);

        this.phInitialized = true;
        console.log(`PostHog initialized`);
      } catch (error) {
        console.error("Failed to load PostHog:", error);
        this.phInitialized = false;
      }
    }
  }

  /**
   * Track a page view in all analytics systems
   */
  async trackPageView(path: string): Promise<void> {
    if (!(await this.enableAnalytics())) return;

    // Send pageview to Google Analytics
    if (window.gtag) {
      // @ts-ignore - Using arguments in the expected way for GA4
      window.gtag("config", this.gaMeasurementId, {
        page_path: path,
      });
    }
    // Send pageview to PostHog
    if (window.posthog) {
      window.posthog.capture("$pageview", {
        path: path,
        site_version: this.siteVersion,
      });
    }
  }

  /**
   * Track a custom event in Google Analytics
   */
  async trackGAEvent(action: string, params: EventParams = {}): Promise<void> {
    if (!(await this.enableAnalytics())) return;

    // Add site version to all events
    const eventParams = {
      ...params,
      site_version: this.siteVersion,
    };

    console.log(`GA Event tracked: ${action}`, eventParams);
  }

  /**
   * Track a custom event in all analytics systems
   */
  async trackEvent(eventName: string, params: EventParams = {}): Promise<void> {
    if (!(await this.enableAnalytics())) return;

    // Add site version to all events
    const eventParams = {
      ...params,
      site_version: this.siteVersion,
    };

    // Send event to Google Analytics
    if (window.gtag) {
      // @ts-ignore - Using arguments in the expected way for GA4
      window.gtag("event", eventName, eventParams);
    }

    // Send event to PostHog
    if (window.posthog) {
      window.posthog.capture(eventName, eventParams);
    }
  }

  /**
   * Track a copy to clipboard event consistently across the site with all analytics
   */
  async trackCopyEvent({
    contentType,
    itemId,
    product,
    language,
  }: {
    contentType: "blog_markdown" | "document_markdown" | "code_snippet";
    itemId: string;
    product: string;
    language?: string;
  }): Promise<void> {
    await this.trackEvent("select_content", { contentType, itemId, product, language });
  }

  /**
   * Report web vitals metrics to GA / PostHog
   */
  async reportWebVital(metric: any): Promise<void> {
    if (!(await this.enableAnalytics())) return;

    console.log(
      `Web vital reported to GA: ${metric.name} - ${Math.round(metric.value * 100) / 100}`
    );

    await this.trackEvent("web-vitals", {
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
