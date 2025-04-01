import {
  Outlet,
  createRootRoute,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import Header from "../components/Header";
import Footer from "../components/Footer";

export const Route = createRootRoute({
  component: () => {
    const router = useRouterState();
    const isLandingPage = router.location.pathname === "/";

    return (
      <>
        <div
          className={`flex flex-col min-h-screen ${isLandingPage ? "bg-watercolor-flipped" : ""} handwriting-enabled`}
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
        <TanStackRouterDevtools />
      </>
    );
  },
});
