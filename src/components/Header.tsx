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
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { getProductRoute } from "@/lib/routes";
import Logo from "@/components/Logo";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import GitHubRepoButton from "@/components/GitHubRepoButton";

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
        "font-medium px-2 py-2 text-xl flex items-center relative cursor-pointer transition-colors duration-200 hover:text-accent-foreground",
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
        isLandingPage ? "bg-transparent text-white" : "bg-background text-foreground",
        scrolled && !isLandingPage ? "border-b border-gray-200 shadow-sm" : "",
        scrolled && isLandingPage
          ? "bg-black/90 dark:bg-black/90 sunset:bg-black/60 backdrop-blur-sm"
          : ""
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

        {/* Desktop Navigation - Centered */}
        <div className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2 z-20">
          {/* Products Menu */}
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "!bg-transparent hover:!bg-transparent data-[state=open]:!bg-transparent data-[state=open]:hover:!bg-transparent focus:!bg-transparent font-medium text-xl flex items-center p-0 cursor-pointer transition-colors duration-200",
                    isLandingPage
                      ? "hover:text-accent-foreground data-[state=open]:text-accent-foreground"
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
                <NavigationMenuContent className="bg-accent p-2">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 w-[300px] sm:w-[480px] gap-2">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to={getProductRoute("mirascope")}
                          className="block p-4 space-y-1.5 rounded-md bg-background hover:bg-accent transition-colors"
                        >
                          <div className="font-medium text-xl text-primary">Mirascope</div>
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
                          className="block p-4 space-y-1.5 rounded-md bg-background hover:bg-accent transition-colors"
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

        <div className="hidden md:flex items-center gap-3">
          <GitHubRepoButton />
          <ThemeSwitcher />
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-black dark:text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          className={cn(
            "absolute top-full right-4 mt-2 p-6 md:hidden z-50 shadow-lg text-slate-800 dark:text-white rounded-lg max-w-xs",
            isLandingPage ? "bg-background/90 backdrop-blur-sm" : "bg-background"
          )}
        >
          <div className="flex flex-col space-y-4">
            <div className="font-medium text-xl my-2">Docs</div>
            <Link
              to={getProductRoute("mirascope")}
              className="p-3 rounded-md bg-white dark:bg-gray-800 text-[#6366f1] font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Mirascope
            </Link>
            <Link
              to={getProductRoute("lilypad")}
              className="p-3 rounded-md bg-white dark:bg-gray-800 text-[#2d8031] font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
            <div className="py-2 flex items-center">
              <span className="font-medium text-xl mr-3">Theme</span>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
