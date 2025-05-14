import React from "react";

import { StorybookThemeProvider } from "@/src/components/core/providers";

// Define the available products
export type ProductType = "mirascope" | "lilypad";

interface ProductThemeDecoratorProps {
  children: React.ReactNode;
  product?: ProductType;
  theme?: "light" | "dark";
  isLandingPage?: boolean;
}

/**
 * A decorator that applies the specified product theme to its children
 */
export const ProductThemeDecorator = ({
  children,
  product = "mirascope",
  theme = "light",
  isLandingPage = false,
}: ProductThemeDecoratorProps) => {
  const productAttr = product === "mirascope" ? {} : { "data-product": product };

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
    minWidth: "250px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  };

  // Choose style based on isLandingPage flag
  const style = isLandingPage ? landingPageStyle : baseStyle;

  return (
    <div {...productAttr} style={style as React.CSSProperties}>
      <StorybookThemeProvider initialTheme={theme}>{children}</StorybookThemeProvider>
    </div>
  );
};

/**
 * Storybook decorator that applies product theme
 * @param product The product theme to apply
 * @param theme Light or dark theme
 * @param isLandingPage Whether to apply landing page styling
 */
export const withProductTheme =
  (product: ProductType = "mirascope", theme: "light" | "dark" = "light", isLandingPage = false) =>
  (Story: any) => {
    return (
      <ProductThemeDecorator product={product} theme={theme} isLandingPage={isLandingPage}>
        <Story />
      </ProductThemeDecorator>
    );
  };
