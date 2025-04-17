import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export default function Footer() {
  const router = useRouterState();
  const isLandingPage = router.location.pathname === "/";

  return (
    <footer
      className={cn(
        "w-full pt-6 pb-3 px-4 sm:px-6 md:px-12 mt-auto",
        isLandingPage ? "bg-transparent" : "bg-background"
      )}
    >
      <div className="max-w-5xl mx-auto flex flex-col-reverse md:flex-row justify-between items-center md:items-center">
        <div
          className={cn(
            "text-sm sm:text-base mt-4 md:mt-0 text-center md:text-left",
            isLandingPage ? "text-white" : "text-foreground"
          )}
        >
          <p>© 2025 Mirascope. All rights reserved.</p>
        </div>

        <div className="flex gap-4 sm:gap-8">
          <Link
            to="/privacy"
            className={cn(
              "text-sm sm:text-base transition-colors",
              isLandingPage ? "text-white hover:text-accent" : "text-foreground hover:text-primary"
            )}
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms/use"
            className={cn(
              "text-sm sm:text-base transition-colors",
              isLandingPage ? "text-white hover:accent" : "text-foreground hover:text-primary"
            )}
          >
            Terms of Use
          </Link>
        </div>
      </div>
    </footer>
  );
}
