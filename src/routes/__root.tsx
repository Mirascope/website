import { Outlet, createRootRoute, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect, useState } from "react";

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
    const [bannerVisible, setBannerVisible] = useState(false);

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

          {/* Spacer div that takes up space when banner is visible */}
          {bannerVisible && <div style={{ height: "80px" }} aria-hidden="true" />}
        </div>

        {/* Cookie consent banner - fixed position */}
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <CookieBanner
            onAccept={() => {
              updateConsent(true);
              setBannerVisible(false);
            }}
            onReject={() => {
              updateConsent(false);
              setBannerVisible(false);
            }}
            onVisibilityChange={setBannerVisible}
          />
        </div>

        <TanStackRouterDevtools />
      </>
    );
  },
});
