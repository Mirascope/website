import { isBrowser, hasAnalyticsConsent } from "./lib/services/analytics";

const reportWebVitals = () => {
  // Early returns if not in browser or no consent given
  if (!isBrowser) return;
  if (!hasAnalyticsConsent()) return;

  // Only import and setup web-vitals if we have consent
  import("web-vitals").then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    const sendToAnalytics = (metric: any) => {
      // Log to console for now
      console.log(`Web vital: ${metric.name} - ${Math.round(metric.value * 100) / 100}`);

      // When Google Analytics is added, you would uncomment this:
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

    onCLS(sendToAnalytics);
    onINP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  });
};

export default reportWebVitals;
