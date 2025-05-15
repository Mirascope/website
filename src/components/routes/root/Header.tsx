import { Link, useRouterState } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/src/components/ui/navigation-menu";
import { cn } from "@/src/lib/utils";
import { getProductRoute } from "@/src/lib/routes";
import {
  MirascopeLogo,
  LilypadLogo,
  GitHubRepoButton,
  DocsProductSelector,
  useProduct,
} from "@/src/components/core";
import ThemeSwitcher from "@/src/components/routes/root/ThemeSwitcher";
import SearchBar from "@/src/components/routes/root/SearchBar";

// Reusable navigation link component
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const NavLink = ({ href, children, className, onClick }: NavLinkProps) => {
  return (
    <Link
      to={href}
      className={cn(
        "relative flex cursor-pointer items-center px-2 py-2 text-xl font-medium",
        "nav-text",
        className
      )}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const router = useRouterState();
  const isLandingPage = router.location.pathname === "/";

  // Determine page type and get the product
  const path = router.location.pathname;
  const isDocsPage = path.startsWith("/docs/");
  const product = useProduct();

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
        isLandingPage
          ? "landing-page-text-shadow bg-transparent text-white"
          : "bg-background text-foreground",
        scrolled && !isLandingPage ? "border-border border-b shadow-sm" : ""
      )}
    >
      <nav className="mx-auto flex w-full max-w-7xl flex-row items-center justify-between">
        <Link
          to="/"
          className={cn("relative z-10 flex items-center", isLandingPage ? "invisible" : "visible")}
        >
          {product === "lilypad" ? (
            <LilypadLogo
              size="small"
              withText={true}
              showBeta={true}
              textClassName={cn(isLandingPage ? "text-white" : "")}
            />
          ) : (
            <MirascopeLogo
              size="small"
              withText={true}
              textClassName={cn(isLandingPage ? "text-white" : "")}
            />
          )}
        </Link>

        {/* Desktop Navigation - Perfectly centered, but hidden during search */}
        <div
          className={cn(
            "absolute left-1/2 z-20 hidden -translate-x-1/2 transform items-center gap-6 transition-opacity duration-300 md:flex",
            isSearchOpen ? "pointer-events-none opacity-0" : "opacity-100"
          )}
        >
          {/* Products Menu */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "flex cursor-pointer items-center !bg-transparent p-0 text-xl font-medium transition-colors duration-200 hover:!bg-transparent focus:!bg-transparent data-[state=open]:!bg-transparent data-[state=open]:hover:!bg-transparent",
                    "nav-text"
                  )}
                >
                  <span className="px-2 py-2">
                    <Link to={getProductRoute(product)} className="h-full w-full">
                      Docs
                    </Link>
                  </span>
                </NavigationMenuTrigger>
                <NavigationMenuContent
                  className={cn(
                    "bg-background p-2 [text-shadow:none]",
                    isLandingPage ? "textured-bg-absolute" : ""
                  )}
                >
                  <ul className="grid w-[300px] grid-cols-1 gap-2 sm:w-[480px] sm:grid-cols-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to={getProductRoute("mirascope")}
                          className={cn(
                            "bg-background block space-y-1.5 rounded-md p-4 transition-colors",
                            "hover:bg-mirascope-purple/20 focus:bg-mirascope-purple/20",
                            "active:bg-mirascope-purple/60 active:scale-[0.98]",
                            "data-[active=true]:bg-mirascope-purple/50 data-[active=true]:hover:bg-mirascope-purple/60",
                            "data-[active=true]:focus:bg-mirascope-purple/60"
                          )}
                        >
                          <div className="text-mirascope-purple text-xl font-medium">Mirascope</div>
                          <p className="text-foreground text-base">
                            LLM abstractions that aren't obstructions.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to={getProductRoute("lilypad")}
                          className={cn(
                            "bg-background block space-y-1.5 rounded-md p-4 transition-colors",
                            "hover:bg-lilypad-green/20 focus:bg-lilypad-green/20",
                            "active:bg-lilypad-green/60 active:scale-[0.98]",
                            "data-[active=true]:bg-lilypad-green/50 data-[active=true]:hover:bg-lilypad-green/60",
                            "data-[active=true]:focus:bg-lilypad-green/60"
                          )}
                        >
                          <div className="text-lilypad-green text-xl font-medium">Lilypad</div>
                          <p className="text-foreground text-base">
                            Spin up your data flywheel with one line of code.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <NavLink href="/blog">Blog</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>
        </div>

        {/* Right section with responsive search and controls */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Search bar that expands left */}
          <SearchBar onOpenChange={setIsSearchOpen} />

          {/* GitHub and Theme buttons that stay visible */}
          <div className="flex items-center gap-3">
            <GitHubRepoButton />
            <ThemeSwitcher />
          </div>
        </div>

        {/* Mobile controls: Search + Theme Switcher + Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <SearchBar onOpenChange={setIsSearchOpen} />
          <ThemeSwitcher />
          <button
            className={cn("p-2", "nav-icon")}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Product selectors for docs and dev pages */}
      {isDocsPage && (
        <div className="mx-auto flex w-full max-w-7xl pt-3 pb-1">
          {isDocsPage && <DocsProductSelector />}
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
