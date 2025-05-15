import React from "react";

import {
  StorybookThemeProvider,
  ProductProvider,
  type Theme,
} from "@/src/components/core/providers";
import type { ProductName } from "@/src/lib/content/spec";

interface ProductThemeDecoratorProps {
  children: React.ReactNode;
  product?: ProductName;
  theme?: "light" | "dark";
  isLandingPage?: boolean;
}

/**
 * A decorator that applies the specified product theme and color theme to its children
 *
 * Note: Instead of manipulating the document root (which doesn't work well with
 * Storybook's iframe-based rendering), we apply classes directly to our container.
 */
export const ProductThemeDecorator = ({
  children,
  product = "mirascope",
  theme = "light",
  isLandingPage = false,
}: ProductThemeDecoratorProps) => {
  // Standard style for component theming
  const baseStyle = {
    padding: "1rem",
    minHeight: "100%",
    background: "var(--color-background)",
    color: "var(--color-foreground)",
  };

  // Landing page background style
  const landingPageStyle = {
    padding: "1.5rem",
    borderRadius: "0.5rem",
    background: theme === "dark" ? "#6366f1" : "#f5f5f5",
    backgroundImage: `url(/assets/backgrounds/${theme}.png)`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "white",
    minHeight: "200px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  };

  // Choose style based on isLandingPage flag
  const style = isLandingPage ? landingPageStyle : baseStyle;

  return (
    <StorybookThemeProvider
      initialTheme={theme as Theme}
      initialCurrent={theme}
      isLandingPage={isLandingPage}
    >
      <ProductProvider product={product}>
        <div
          className={theme}
          style={style as React.CSSProperties}
          data-landing-page={isLandingPage ? "true" : undefined}
        >
          {children}
        </div>
      </ProductProvider>
    </StorybookThemeProvider>
  );
};

/**
 * Storybook decorator that applies product theme and color theme
 * @param product The product theme to apply
 * @param theme Light or dark theme
 * @param isLandingPage Whether to apply landing page styling
 */
export const withProductTheme =
  (product: ProductName = "mirascope", theme: "light" | "dark" = "light", isLandingPage = false) =>
  (Story: any) => {
    return (
      <ProductThemeDecorator product={product} theme={theme} isLandingPage={isLandingPage}>
        <Story />
      </ProductThemeDecorator>
    );
  };
