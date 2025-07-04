import { Outlet, createRootRoute, useRouterState, redirect } from "@tanstack/react-router";
import { processRedirects } from "../lib/redirects";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { getProductFromPath } from "../lib/utils";

import { Header, Footer, CookieBanner, DevToolsButton } from "@/src/components/routes/root";
import analyticsManager from "@/src/lib/services/analytics";
import {
  FunModeProvider,
  ThemeProvider,
  ProductProvider,
  TabbedSectionMemoryProvider,
  CoreMeta,
} from "@/src/components";

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
    const isLandingPage = ["/", "/router-waitlist"].includes(path);

    useEffect(() => {
      analyticsManager.trackPageView(path);
    }, [path]);

    // Initialize analytics and set product on first mount
    useEffect(() => {
      analyticsManager.enableAnalytics();
    }, []);

    return (
      <>
        {/* Base metadata for site (charset, viewport, favicons, etc) */}
        <CoreMeta>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />

          {/* PNG fallback for Safari and browsers that don't support SVG */}
          <link rel="icon" href="/favicon.png" sizes="any" type="image/png" />

          {/* SVG favicon for modern browsers */}
          <link
            rel="icon"
            href="data:image/svg+xml,%3C?xml version='1.0' encoding='UTF-8'?%3E%3C!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'%3E%3Csvg xmlns='http://www.w3.org/2000/svg' version='1.1' width='32px' height='32px' style='shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Cg transform='translate(0,5.5) scale(0.0533)'%3E%3Cpath style='opacity:0.997' fill='%236366f1' d='M 413.5,-0.5 C 422.5,-0.5 431.5,-0.5 440.5,-0.5C 456.79,2.21267 471.457,8.71267 484.5,19C 501.407,37.6222 522.407,48.6222 547.5,52C 588.944,64.0603 605.444,91.227 597,133.5C 594.363,140.777 590.696,147.444 586,153.5C 580.136,159.699 573.969,165.532 567.5,171C 549.653,184.425 531.986,198.091 514.5,212C 463.586,259.822 449.086,316.989 471,383.5C 474.084,395.519 480.918,404.686 491.5,411C 503.85,413.188 516.184,415.521 528.5,418C 553.401,427.563 569.068,445.23 575.5,471C 574.298,480.358 569.298,486.525 560.5,489.5C 521.833,489.5 483.167,489.5 444.5,489.5C 424.171,485.412 407.671,475.079 395,458.5C 354.757,381.52 291.091,340.186 204,334.5C 200.167,334.833 196.333,335.167 192.5,335.5C 191.332,336.906 191.665,338.072 193.5,339C 273.005,342.805 332.839,378.638 373,446.5C 378.385,467.243 371.218,481.577 351.5,489.5C 282.167,489.5 212.833,489.5 143.5,489.5C 123.652,488.816 103.652,487.982 83.5,487C 46.8314,480.66 20.9981,460.493 6,426.5C 3.33838,418.837 1.17171,411.171 -0.5,403.5C -0.5,394.167 -0.5,384.833 -0.5,375.5C 1.52027,365.267 4.68694,355.267 9,345.5C 23.8337,317.005 42.1671,291.005 64,267.5C 135.956,194.134 217.123,133.301 307.5,85C 330.208,71.6256 347.375,53.1256 359,29.5C 373.554,12.809 391.72,2.80903 413.5,-0.5 Z M 434.5,67.5 C 459.349,65.5761 473.349,76.9095 476.5,101.5C 475.977,116.842 468.644,127.342 454.5,133C 439.374,137.426 426.207,134.259 415,123.5C 406.695,111.618 405.362,98.9516 411,85.5C 416.58,76.4706 424.413,70.4706 434.5,67.5 Z'/%3E%3C/g%3E%3C/svg%3E"
            type="image/svg+xml"
          />

          {/* Preload Williams Handwriting font - critical for brand */}
          <link
            rel="preload"
            href="/fonts/Williams-Handwriting-Regular-v1.ttf"
            as="font"
            type="font/ttf"
            crossOrigin="anonymous"
          />

          {/* Other important tags */}
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/manifest.json" />
        </CoreMeta>

        {/* Fixed background for landing page */}
        {isLandingPage && <div className="watercolor-bg"></div>}

        <ThemeProvider>
          <ProductProvider product={getProductFromPath(path)}>
            <div
              className="flex min-h-screen flex-col px-2"
              style={
                {
                  "--header-height": path.startsWith("/docs/")
                    ? "var(--header-height-with-selector)"
                    : "var(--header-height-base)",
                } as React.CSSProperties
              }
            >
              {/* Header is fixed, so it's outside the content flow */}
              <Header showProductSelector={path.startsWith("/docs/")} />

              {/* Content container with padding to account for fixed header */}
              <div
                className="mx-auto w-full max-w-7xl flex-grow"
                style={{ paddingTop: "var(--header-height)" }}
              >
                <FunModeProvider>
                  <TabbedSectionMemoryProvider>
                    <main className="flex-grow">
                      <Outlet />
                    </main>
                  </TabbedSectionMemoryProvider>
                </FunModeProvider>
              </div>
              <Footer />
            </div>

            {/* Cookie consent banner - positioned in lower left corner */}
            <CookieBanner />
          </ProductProvider>

          {/* Dev tools - only visible in development */}
          <TanStackRouterDevtools />
          <DevToolsButton className="fixed bottom-10 left-2 z-50" />
        </ThemeProvider>
      </>
    );
  },
});
