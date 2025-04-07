import { Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect } from "react";

import Header from "../components/Header";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import useAnalyticsConsent from "../lib/hooks/useAnalyticsConsent";
import { trackPageView } from "../lib/services/analytics";
import { SITE_VERSION } from "../lib/constants/site";

export const Route = createRootRoute({
  component: () => {
    const router = useRouterState();
    const isLandingPage = router.location.pathname === "/";
    const { updateConsent, hasConsent } = useAnalyticsConsent();

    // Track page views when route changes
    useEffect(() => {
      // Only track if user has given consent
      if (hasConsent) {
        const path = router.location.pathname;
        trackPageView(path);
        console.log(`Page view: ${path} (Site Version: ${SITE_VERSION})`);
      }
    }, [router.location.pathname, hasConsent]);

    return (
      <>
        <div
          className={`px-4 sm:px-6 flex flex-col min-h-screen ${
            isLandingPage ? "bg-watercolor-flipped" : ""
          } handwriting-enabled`}
        >
          {/* Header is fixed, so it's outside the content flow */}
          <Header />

          {/* Content container with padding to account for fixed header */}
          <div className="pt-24 max-w-7xl mx-auto w-full flex-grow">
            <main className="flex-grow">
              <Outlet />
            </main>
          </div>
          <Footer />
        </div>

        {/* Cookie consent banner - positioned in lower left corner */}
        <CookieBanner
          onAccept={() => {
            updateConsent(true);
          }}
          onReject={() => {
            updateConsent(false);
          }}
        />

        <TanStackRouterDevtools />
      </>
    );
  },
});
