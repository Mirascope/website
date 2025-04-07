const reportWebVitals = (onPerfEntry?: () => void) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import("web-vitals").then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(onPerfEntry);
      onINP(onPerfEntry);
      onFCP(onPerfEntry);
      onLCP(onPerfEntry);
      onTTFB(onPerfEntry);
    });
  } else {
    // Check consent before sending analytics data to a service
    const hasConsent = localStorage.getItem("cookie-consent") === "accepted";

    if (hasConsent) {
      // This would be where you'd send analytics to a third-party service
      // For example, Google Analytics
      console.log("Web vitals could be sent to analytics service");

      // When Google Analytics is added, you would uncomment this:
      /*
      import("web-vitals").then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        const sendToAnalytics = (metric) => {
          // Send to Google Analytics or other service
          if (window.gtag) {
            window.gtag('event', 'web-vitals', {
              event_category: 'Web Vitals',
              event_label: metric.id,
              value: Math.round(metric.value * 100) / 100,
              non_interaction: true,
            });
          }
        };
        
        onCLS(sendToAnalytics);
        onINP(sendToAnalytics);
        onFCP(sendToAnalytics);
        onLCP(sendToAnalytics);
        onTTFB(sendToAnalytics);
      });
      */
    }
  }
};

export default reportWebVitals;
