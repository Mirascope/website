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
import Logo from "@/components/Logo";

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
        "font-medium px-2 py-2 text-xl flex items-center relative cursor-pointer transition-colors duration-200",
        isLandingPage ? "hover:text-gray-300" : "hover:text-gray-600",
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
        "py-6 px-4 sm:px-6 flex justify-center items-center fixed top-0 left-0 right-0 w-full z-50 transition-all duration-200",
        isLandingPage
          ? "bg-transparent text-white"
          : "bg-background text-slate-800 dark:text-white",
        scrolled && !isLandingPage ? "border-b border-gray-200 shadow-sm" : "",
        scrolled && isLandingPage ? "bg-black/90 backdrop-blur-sm" : ""
      )}
    >
      <nav className="flex flex-row items-center justify-between w-full max-w-7xl mx-auto">
        <Link
          to="/"
          className={cn(
            "flex items-center relative z-10",
            isLandingPage ? "invisible" : "visible"
          )}
        >
          <Logo
            size="small"
            withText={true}
            textClassName={cn(isLandingPage ? "text-white" : "text-primary")}
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
                      ? "hover:text-gray-300 data-[state=open]:text-gray-300"
                      : "hover:text-gray-600 data-[state=open]:text-gray-600"
                  )}
                >
                  Docs
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background dark:bg-popover p-4">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 w-[300px] sm:w-[480px] gap-4">
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/docs/mirascope"
                          className="block p-4 space-y-1.5 rounded-md bg-background dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="font-medium text-xl text-[#6366f1]">
                            Mirascope
                          </div>
                          <p className="text-base text-gray-600 dark:text-gray-300">
                            LLM abstractions that aren't obstructions.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <Link
                          to="/docs/lilypad"
                          className="block p-4 space-y-1.5 rounded-md bg-background dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="font-medium text-xl text-[#2d8031]">
                            Lilypad
                          </div>
                          <p className="text-base text-gray-600 dark:text-gray-300">
                            Start building your data flywheel in one line of
                            code.
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

        <div className="hidden md:flex"></div>

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
            isLandingPage
              ? "bg-background/90 backdrop-blur-sm"
              : "bg-background"
          )}
        >
          <div className="flex flex-col space-y-4">
            <div className="font-medium text-xl my-2">Docs</div>
            <Link
              to="/docs/mirascope"
              className="p-3 rounded-md bg-white dark:bg-gray-800 text-[#6366f1] font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Mirascope
            </Link>
            <Link
              to="/docs/lilypad"
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
          </div>
        </div>
      )}
    </header>
  );
}
