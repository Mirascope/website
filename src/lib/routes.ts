import type { ValidStaticPath } from "./route-types";
import type { ProductName } from "@/src/lib/content/spec";

// Map of product names to their static route paths
// This allows adding new products by just extending this object
export const PRODUCT_ROUTES: Record<ProductName, ValidStaticPath> = {
  mirascope: "/docs/mirascope",
  "mirascope-v2": "/docs/mirascope-v2",
  lilypad: "/docs/lilypad",
};

// Handle type compatibility with TanStack Router paths
// Using type assertion to match what the router expects
export function getProductRoute(product: ProductName): any {
  return PRODUCT_ROUTES[product] as any;
}

// Function to create a section route with the dynamic path pattern
export function getSectionRoute(_product: ProductName, _section: string): any {
  return "/docs/$product/$" as any;
}

// Function to create params for a section route
export function getSectionParams(product: ProductName, section: string): any {
  return { product, _splat: section } as any;
}

// Function to create a blog post route
export function getBlogRoute(_slug: string): any {
  return "/blog/$slug" as any;
}

// Function to create params for a blog post route
export function getBlogParams(slug: string): { slug: string } {
  return { slug };
}
