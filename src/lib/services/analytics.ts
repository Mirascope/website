/**
 * Analytics service to handle all tracking functionality.
 * Currently set up for future Google Analytics integration.
 */

// Check if analytics consent has been given
export const hasAnalyticsConsent = (): boolean => {
  return localStorage.getItem("cookie-consent") === "accepted";
};

// Initialize analytics with proper consent settings
export const initializeAnalytics = (): void => {
  const hasConsent = hasAnalyticsConsent();

  // This is where you would initialize Google Analytics with proper consent mode
  // For now, we just log to console
  console.log(`Analytics initialized with consent: ${hasConsent}`);

  // Example Google Analytics initialization with consent mode (uncomment when adding GA)
  /*
  // Add the script dynamically only when needed
  if (typeof window !== 'undefined' && !document.getElementById('ga-script')) {
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
      'analytics_storage': hasConsent ? 'granted' : 'denied',
      'ad_storage': 'denied', // Always deny ad storage by default
    });
    
    // Initialize with the measurement ID
    gtag('config', 'YOUR_GA_MEASUREMENT_ID', {
      'anonymize_ip': true,
      'send_page_view': hasConsent,
    });
  }
  */
};

// Update consent settings in analytics platforms
export const updateAnalyticsConsent = (consent: boolean): void => {
  // This is where you would update Google Analytics consent settings
  console.log(`Analytics consent updated: ${consent}`);

  // Example code for updating Google Analytics consent (uncomment when adding GA)
  /*
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('consent', 'update', {
      'analytics_storage': consent ? 'granted' : 'denied',
    });
  }
  */
};

// Track a page view
export const trackPageView = (path: string): void => {
  if (!hasAnalyticsConsent()) return;

  // This is where you would send a page view to Google Analytics
  console.log(`Page view tracked: ${path}`);

  // Example code for tracking pageview in Google Analytics (uncomment when adding GA)
  /*
  if (typeof window !== 'undefined' && window.gtag) {
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
  if (!hasAnalyticsConsent()) return;

  // This is where you would send an event to Google Analytics
  console.log(`Event tracked: ${category} - ${action} - ${label} - ${value}`);

  // Example code for tracking event in Google Analytics (uncomment when adding GA)
  /*
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      'event_category': category,
      'event_label': label,
      'value': value,
    });
  }
  */
};
