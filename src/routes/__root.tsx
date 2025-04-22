import { Outlet, createRootRoute, useRouterState, redirect } from "@tanstack/react-router";
import { processRedirects } from "../lib/redirects";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { BASE_URL } from "../lib/constants/site";

import Header from "../components/Header";
import Footer from "../components/Footer";
import CookieBanner from "../components/CookieBanner";
import analyticsManager from "../lib/services/analytics";

export const Route = createRootRoute({
  beforeLoad: ({ location }) => {
    // Skip redirect check for normal routes that already exist
    // Process redirects first for all incoming requests
    const path = location.pathname;

    // Check if this is a path that needs redirection
    const redirectTo = processRedirects(path);
    if (redirectTo) {
      console.log(`Root redirect: ${path} -> ${redirectTo}`);
      throw redirect({
        to: redirectTo,
        replace: true,
      });
    }
  },
  component: () => {
    const router = useRouterState();
    const isLandingPage = router.location.pathname === "/";

    // Initialize analytics during component mount
    useEffect(() => {
      analyticsManager.enableAnalytics();
    }, []);

    // Track page views when route changes
    useEffect(() => {
      const path = router.location.pathname;
      // Will only track if analytics are enabled (respects consent / GDPR)
      analyticsManager.trackPageView(path);
    }, [router.location.pathname]);

    return (
      <>
        <Helmet defaultTitle="Mirascope">
          {/* Essential meta tags */}
          <html lang="en" />
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="icon" href="/favicon.ico" />
          <meta name="theme-color" content="#000000" />
          <meta name="description" content="The AI Engineer's Developer Stack" />

          {/* Preload Williams Handwriting font - critical for brand */}
          <link
            rel="preload"
            href="/fonts/Williams-Handwriting-Regular-v1.ttf"
            as="font"
            type="font/ttf"
            crossOrigin="anonymous"
          />

          {/* Default Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={`${BASE_URL}/`} />
          <meta property="og:title" content="Mirascope" />
          <meta property="og:description" content="The AI Engineer's Developer Stack" />
          <meta property="og:image" content={`${BASE_URL}/social-cards/index.webp`} />
          <meta property="og:logo" content={`${BASE_URL}/frog-logo.png`} />

          {/* Default Twitter */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={`${BASE_URL}/`} />
          <meta name="twitter:title" content="Mirascope" />
          <meta name="twitter:description" content="The AI Engineer's Developer Stack" />
          <meta name="twitter:image" content={`${BASE_URL}/social-cards/index.webp`} />
          <meta name="twitter:site:logo" content={`${BASE_URL}/frog-logo.png`} />

          {/* Other important tags */}
          <link rel="apple-touch-icon" href="/frog-logo.png" />
          <link rel="manifest" href="/manifest.json" />
        </Helmet>

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
        <CookieBanner />

        <TanStackRouterDevtools />
      </>
    );
  },
});
