import { Link } from "@tanstack/react-router";
import React from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from "@/src/components/ui/navigation-menu";
import { cn } from "@/src/lib/utils";
import { getProductRoute } from "@/src/lib/routes";
import { useProduct, useIsLandingPage } from "@/src/components/core";
import { PRODUCT_CONFIGS } from "@/src/lib/constants/site";
import type { ProductName } from "@/src/lib/content/spec";

// Reusable navigation link component
interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * ProductMenuLink component for product navigation links.
 * Retrieves product information from global config and applies appropriate styling.
 */
interface ProductMenuLinkProps {
  productName: ProductName;
}

const ProductMenuLink = ({ productName }: ProductMenuLinkProps) => {
  const config = PRODUCT_CONFIGS[productName];

  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          to={getProductRoute(productName)}
          className={cn(
            "bg-background block space-y-1.5 rounded-md p-4 transition-colors",
            "hover:bg-primary/20 focus:bg-primary/20",
            "active:bg-primary/60 active:scale-[0.98]",
            "data-[active=true]:bg-primary/50 data-[active=true]:hover:bg-primary/60",
            "data-[active=true]:focus:bg-primary/60"
          )}
          data-product={productName}
        >
          <div className="text-primary text-xl font-medium">{config.title}</div>
          <p className="text-foreground text-base">{config.tagline}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

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

interface DesktopNavigationProps {
  /**
   * Whether the search bar is open, affecting navigation visibility
   */
  isSearchOpen: boolean;
}

export default function DesktopNavigation({ isSearchOpen }: DesktopNavigationProps) {
  // Get the current product
  const product = useProduct();
  const isLandingPage = useIsLandingPage();

  return (
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
                <ProductMenuLink productName="mirascope" />
                <ProductMenuLink productName="lilypad" />
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <NavLink href="/blog">Blog</NavLink>
      <NavLink href="/pricing">Pricing</NavLink>
    </div>
  );
}
