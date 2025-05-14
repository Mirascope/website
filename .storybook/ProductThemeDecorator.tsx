import React from "react";

// Define the available products
export type ProductType = "default" | "lilypad";
export type ThemeType = "light" | "dark";

interface ProductThemeDecoratorProps {
  children: React.ReactNode;
  product?: ProductType;
  theme?: ThemeType;
}

/**
 * A decorator that applies the specified product theme to its children
 */
export const ProductThemeDecorator = ({
  children,
  product = "default",
  theme = "light",
}: ProductThemeDecoratorProps) => {
  const productAttr = product === "default" ? {} : { "data-product": product };
  const themeClass = theme === "light" ? "" : "dark";

  return (
    <div
      className={themeClass}
      {...productAttr}
      style={{
        padding: "1rem",
        minHeight: "100%",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
      }}
    >
      {children}
    </div>
  );
};

/**
 * Storybook decorator that applies product theme
 */
export const withProductTheme =
  (product: ProductType, theme: ThemeType = "light") =>
  (Story: any) => {
    return (
      <ProductThemeDecorator product={product} theme={theme}>
        <Story />
      </ProductThemeDecorator>
    );
  };
