/**
 * Analytics service to handle all tracking functionality.
 * Currently set up for future Google Analytics integration.
 */

// Centralized check for browser environment
export const isBrowser = typeof window !== "undefined";

// Check if analytics consent has been given
export const hasAnalyticsConsent = (): boolean => {
  if (!isBrowser) return false;
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

  // Example Google Analytics initialization with consent mode (uncomment when adding GA)
  /*
  // Add the script dynamically only when needed
  if (!document.getElementById('ga-script')) {
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=YOUR_GA_MEASUREMENT_ID`;
    document.head.appendChild(script);
    
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    
    // Set default consent settings
    gtag('consent', 'default', {
      'analytics_storage': 'granted', // We only initialize if consent is given
      'ad_storage': 'denied', // Always deny ad storage by default
    });
    
    // Initialize with the measurement ID
    gtag('config', 'YOUR_GA_MEASUREMENT_ID', {
      'anonymize_ip': true,
      'send_page_view': true,
    });
  }
  */
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

    // Example code for updating Google Analytics consent (uncomment when adding GA)
    /*
    if (window.gtag) {
      window.gtag('consent', 'update', {
        'analytics_storage': 'denied',
      });
    }
    */
  }
};

// Track a page view
export const trackPageView = (path: string): void => {
  if (!isBrowser || !hasAnalyticsConsent() || !analyticsInitialized) return;

  console.log(`Page view tracked: ${path}`);

  // Example code for tracking pageview in Google Analytics (uncomment when adding GA)
  /*
  if (window.gtag) {
    window.gtag('config', 'YOUR_GA_MEASUREMENT_ID', {
      'page_path': path,
    });
  }
  */
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

  // Example code for tracking event in Google Analytics (uncomment when adding GA)
  /*
  if (window.gtag) {
    window.gtag('event', action, {
      'event_category': category,
      'event_label': label,
      'value': value,
    });
  }
  */
};

// Web vitals reporting function that respects consent
export const reportWebVitalsToAnalytics = (metric: any): void => {
  if (!isBrowser || !hasAnalyticsConsent() || !analyticsInitialized) return;

  console.log(`Web vital reported: ${metric.name} - ${Math.round(metric.value * 100) / 100}`);

  // Example code for tracking web vitals in Google Analytics (uncomment when adding GA)
  /*
  if (window.gtag) {
    window.gtag('event', 'web-vitals', {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.value * 100) / 100,
      non_interaction: true,
    });
  }
  */
};
