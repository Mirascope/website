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
import { getProductRoute } from "@/src/lib/routes";
import { useProduct, useIsLandingPage } from "@/src/components/core";
import { PRODUCT_CONFIGS } from "@/src/lib/constants/site";
import type { ProductName } from "@/src/lib/content/spec";
import { cn } from "@/src/lib/utils";
import { NAV_LINK_STYLES, PRODUCT_LINK_STYLES, DESKTOP_NAV_STYLES } from "./styles";

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
          className={PRODUCT_LINK_STYLES.desktop.container}
          data-product={productName}
        >
          <div className={PRODUCT_LINK_STYLES.desktop.title}>{config.title}</div>
          <p className={PRODUCT_LINK_STYLES.desktop.description}>{config.tagline}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};

const NavLink = ({ href, children, className, onClick }: NavLinkProps) => {
  return (
    <Link to={href} className={cn(NAV_LINK_STYLES.base, className)} onClick={onClick}>
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
    <div className={DESKTOP_NAV_STYLES.container(isSearchOpen)}>
      {/* Products Menu */}
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className={DESKTOP_NAV_STYLES.menuTrigger}>
              <span className="px-2 py-2">
                <Link to={getProductRoute(product)} className="h-full w-full">
                  Docs
                </Link>
              </span>
            </NavigationMenuTrigger>
            <NavigationMenuContent className={DESKTOP_NAV_STYLES.menuContent(isLandingPage)}>
              <ul className={DESKTOP_NAV_STYLES.productGrid}>
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
