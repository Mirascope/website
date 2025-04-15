import { isBrowser } from "./lib/services/analytics";
import analyticsManager from "./lib/services/analytics";

const reportWebVitals = () => {
  // Skip if not in browser
  if (!isBrowser) return;

  // Always import and set up listeners, but report conditionally
  import("web-vitals").then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
    // Analytics manager handles consent check internally
    const sendToAnalytics = (metric: any) => {
      analyticsManager.reportWebVital(metric);
    };

    onCLS(sendToAnalytics);
    onINP(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  });
};

export default reportWebVitals;
