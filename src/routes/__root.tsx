import { Outlet, createRootRoute, useRouterState, redirect } from "@tanstack/react-router";
import { processRedirects } from "../lib/redirects";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { getProductFromPath } from "../lib/utils";

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
    const path = router.location.pathname;
    const isLandingPage = path === "/";

    useEffect(() => {
      const newProduct = getProductFromPath(path);
      document.documentElement.setAttribute("data-product", newProduct);
      analyticsManager.trackPageView(path);
    }, [path]);

    // Make sure we set the data-product on first render (and not in useEffect),
    // so we will SSR product pages with correct styles.
    if (
      typeof document !== "undefined" &&
      document.documentElement &&
      !document.documentElement.getAttribute("data-product")
    ) {
      const currentProduct = getProductFromPath(path);
      document.documentElement.setAttribute("data-product", currentProduct);
    }

    // Initialize analytics and set product on first mount
    useEffect(() => {
      analyticsManager.enableAnalytics();
    }, []);

    return (
      <>
        {/* Only essential HTML tags - SEO is handled by SEOMeta */}
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="icon" href="/favicon.ico" />

          {/* Preload Williams Handwriting font - critical for brand */}
          <link
            rel="preload"
            href="/fonts/Williams-Handwriting-Regular-v1.ttf"
            as="font"
            type="font/ttf"
            crossOrigin="anonymous"
          />

          {/* Other important tags */}
          <link rel="apple-touch-icon" href="/assets/branding/logo.webp" />
          <link rel="manifest" href="/manifest.json" />
        </head>

        <div
          className={`flex min-h-screen flex-col px-4 sm:px-6 ${
            isLandingPage ? "bg-watercolor-flipped" : ""
          } handwriting-enabled`}
        >
          {/* Header is fixed, so it's outside the content flow */}
          <Header />

          {/* Content container with padding to account for fixed header */}
          <div className="mx-auto w-full max-w-7xl flex-grow pt-24">
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
