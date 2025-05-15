import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { getProductRoute } from "@/src/lib/routes";
import {
  ProductLogo,
  GitHubRepoButton,
  DocsProductSelector,
  useIsLandingPage,
} from "@/src/components/core";
import ThemeSwitcher from "@/src/components/routes/root/ThemeSwitcher";
import SearchBar from "@/src/components/routes/root/SearchBar";
import DesktopNavigation from "@/src/components/routes/root/DesktopNavigation";

interface HeaderProps {
  /**
   * Whether to show the product selector for docs pages
   */
  showProductSelector?: boolean;
}

export default function Header({ showProductSelector = false }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Use the isLandingPage hook instead of router
  const isLandingPage = useIsLandingPage();

  // State to track scroll position
  const [scrolled, setScrolled] = useState(false);

  // Effect to handle scroll position
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 left-0 z-50 mb-2 flex w-full flex-col items-center justify-center px-4 py-2 sm:px-6",
        "landing-text landing-page-text-shadow",
        isLandingPage ? "" : "bg-background",
        scrolled && !isLandingPage ? "border-border border-b shadow-sm" : ""
      )}
    >
      <nav className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between">
        <Link
          to="/"
          className={cn("relative z-10 flex items-center", isLandingPage ? "invisible" : "visible")}
        >
          <ProductLogo size="small" withText={true} textClassName={"landing-text"} />
        </Link>

        <DesktopNavigation isSearchOpen={isSearchOpen} />

        {/* Right section with responsive controls */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Single search bar instance for all viewport sizes */}
          <SearchBar
            onOpenChange={(isOpen: boolean) => {
              setIsSearchOpen(isOpen);
            }}
          />

          {/* Desktop: GitHub + Theme buttons */}
          <div className="hidden items-center gap-3 md:flex">
            <GitHubRepoButton />
          </div>

          {/* Theme switcher - visible on all screen sizes */}
          <ThemeSwitcher />

          {/* Mobile menu button - hidden on desktop */}
          <button
            className={cn("p-2 md:hidden", "nav-icon")}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Product selectors for docs and dev pages */}
      {showProductSelector && (
        <div className="mx-auto flex w-full max-w-7xl pt-3 pb-1">
          <DocsProductSelector />
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="text-foreground bg-background absolute top-full right-4 z-50 mt-2 max-w-xs rounded-lg p-6 shadow-lg [text-shadow:none] md:hidden">
          <div className="flex flex-col space-y-4">
            <div className="my-2 text-xl font-medium">Docs</div>
            <Link
              to={getProductRoute("mirascope")}
              className="bg-background text-mirascope-purple hover:bg-muted rounded-md p-3 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Mirascope
            </Link>
            <Link
              to={getProductRoute("lilypad")}
              className="bg-background text-lilypad-green hover:bg-muted rounded-md p-3 font-medium transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Lilypad
            </Link>
            <hr className="my-2" />
            <Link
              to="/blog"
              className="hover:text-primary relative flex cursor-pointer items-center py-2 text-xl font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              to="/pricing"
              className="hover:text-primary relative flex cursor-pointer items-center py-2 text-xl font-medium transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
