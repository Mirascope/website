import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/src/lib/utils";

export default function Footer() {
  const router = useRouterState();
  const isLandingPage = router.location.pathname === "/";

  // Define common text styles based on landing page status
  const textStyles = isLandingPage ? "text-white landing-page-text-shadow" : "text-foreground";

  // Define hover styles
  const hoverStyles = isLandingPage ? "hover:text-accent" : "hover:text-primary";

  return (
    <footer
      className={cn(
        "mt-auto w-full px-4 pt-6 pb-3 sm:px-6 md:px-12",
        isLandingPage ? `bg-transparent ${textStyles}` : "bg-background"
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col-reverse items-center justify-between md:flex-row md:items-center">
        <div className="mt-4 text-center text-sm sm:text-base md:mt-0 md:text-left">
          <p>© 2025 Mirascope. All rights reserved.</p>
        </div>

        <div className="flex gap-4 sm:gap-8">
          <Link to="/privacy" className={cn("text-sm transition-colors sm:text-base", hoverStyles)}>
            Privacy Policy
          </Link>
          <Link
            to="/terms/use"
            className={cn("text-sm transition-colors sm:text-base", hoverStyles)}
          >
            Terms of Use
          </Link>
        </div>
      </div>
    </footer>
  );
}
