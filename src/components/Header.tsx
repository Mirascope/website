import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
import Logo from "@/src/components/Logo";
import ThemeSwitcher from "@/src/components/ThemeSwitcher";
import GitHubRepoButton from "@/src/components/GitHubRepoButton";
import SearchBar from "@/src/components/SearchBar";

// Reusable navigation link component
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const NavLink = ({ href, children, className, onClick }: NavLinkProps) => {
  const router = useRouterState();
  const isLandingPage = router.location.pathname === "/";

  return (
    <Link
      to={href}
      className={cn(
        "font-medium px-2 py-2 text-xl flex items-center relative cursor-pointer transition-colors duration-200 hover:text-accent-foreground",
        isLandingPage && "landing-page-text-shadow",
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
        "py-6 px-4 sm:px-6 flex justify-center items-center fixed top-0 left-0 right-0 w-full z-50",
        isLandingPage
          ? "bg-transparent text-white landing-page-text-shadow"
          : "bg-background text-foreground",
        scrolled && !isLandingPage ? "border-b border-border shadow-sm" : "",
        scrolled && isLandingPage ? "bg-foreground/80 backdrop-blur-sm" : ""
      )}
    >
      <nav className="flex flex-row items-center justify-between w-full max-w-7xl mx-auto">
        <Link
          to="/"
          className={cn("flex items-center relative z-10", isLandingPage ? "invisible" : "visible")}
        >
          <Logo
            size="small"
            withText={true}
            textClassName={cn(isLandingPage ? "text-white" : "text-mirascope-purple")}
          />
        </Link>

        {/* Desktop Navigation - Perfectly centered, but hidden during search */}
        <div
          className={cn(
            "hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2 z-20 transition-opacity duration-300",
            isSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
        >
          {/* Products Menu */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "!bg-transparent hover:!bg-transparent data-[state=open]:!bg-transparent data-[state=open]:hover:!bg-transparent focus:!bg-transparent font-medium text-xl flex items-center p-0 cursor-pointer transition-colors duration-200",
                    isLandingPage
                      ? "hover:text-accent-foreground data-[state=open]:text-accent-foreground landing-page-text-shadow"
                      : "hover:text-accent-foreground data-[state=open]:text-accent-foreground"
                  )}
                  onClick={(e) => {
                    // Prevent the default behavior which would toggle the dropdown
                    e.preventDefault();
                    // Navigate to Mirascope docs
                    window.location.href = getProductRoute("mirascope");
                  }}
                >
                  Docs
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-2 [text-shadow:none]">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 w-[300px] sm:w-[480px] gap-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to={getProductRoute("mirascope")}
                          className="block p-4 space-y-1.5 rounded-md bg-background hover:bg-mirascope-purple/20 transition-colors"
                        >
                          <div className="font-medium text-xl text-mirascope-purple">Mirascope</div>
                          <p className="text-base text-foreground">
                            LLM abstractions that aren't obstructions.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to={getProductRoute("lilypad")}
                          className="block p-4 space-y-1.5 rounded-md bg-background hover:bg-lilypad-green/20 transition-colors"
                        >
                          <div className="font-medium text-xl text-lilypad-green">Lilypad</div>
                          <p className="text-base text-foreground">
                            Start building your data flywheel in one line of code.
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
        <div className="hidden md:flex items-center gap-3">
          {/* Search bar that expands left */}
          <SearchBar onOpenChange={setIsSearchOpen} isLandingPage={isLandingPage} />

          {/* GitHub and Theme buttons that stay visible */}
          <div className="flex items-center gap-3">
            <GitHubRepoButton />
            <ThemeSwitcher />
          </div>
        </div>

        {/* Mobile controls: Theme Switcher + Menu Button */}
        <div className="md:hidden flex items-center gap-1">
          <ThemeSwitcher />
          <button
            className={cn("p-2", isLandingPage ? "text-white" : "text-foreground")}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className={cn(
            "absolute top-full right-4 mt-2 p-6 md:hidden z-50 shadow-lg text-foreground rounded-lg max-w-xs",
            isLandingPage ? "bg-background/90 backdrop-blur-sm" : "bg-background"
          )}
        >
          <div className="flex flex-col space-y-4">
            <div className="font-medium text-xl my-2">Docs</div>
            <Link
              to={getProductRoute("mirascope")}
              className="p-3 rounded-md bg-background text-primary font-medium hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Mirascope
            </Link>
            <Link
              to={getProductRoute("lilypad")}
              className="p-3 rounded-md bg-background text-lilypad-green font-medium hover:bg-muted transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Lilypad
            </Link>
            <hr className="my-2" />
            <Link
              to="/blog"
              className="font-medium py-2 text-xl flex items-center relative cursor-pointer hover:text-primary transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              to="/pricing"
              className="font-medium py-2 text-xl flex items-center relative cursor-pointer hover:text-primary transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </Link>
            <hr className="my-2" />
            <div className="py-2 w-full mt-3">
              <SearchBar
                onOpenChange={(open) => open && setIsMenuOpen(false)}
                isLandingPage={isLandingPage}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
