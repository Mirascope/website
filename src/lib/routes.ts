import type { ProductName, ValidStaticPath, ValidDynamicPath } from "./route-types";

// Map of product names to their static route paths
// This allows adding new products by just extending this object
export const PRODUCT_ROUTES: Record<ProductName, ValidStaticPath> = {
  "mirascope": "/docs/mirascope",
  "lilypad": "/docs/lilypad",
};

// Safely get a product route, with type checking
export function getProductRoute(product: ProductName): ValidStaticPath {
  return PRODUCT_ROUTES[product];
}

// Function to create a section route with the dynamic path pattern
export function getSectionRoute(_product: ProductName, _section: string): ValidDynamicPath {
  return "/docs/$product/$";
}

// Function to create params for a section route
export function getSectionParams(product: ProductName, section: string): { product: ProductName; _splat: string } {
  return { product, _splat: section };
}

// Function to create a blog post route
export function getBlogRoute(_slug: string): ValidDynamicPath {
  return "/blog/$slug";
}

// Function to create params for a blog post route
export function getBlogParams(slug: string): { slug: string } {
  return { slug };
}