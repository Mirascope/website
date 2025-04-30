import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { type ProductName } from "./content";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a route path to a filename-safe string
 * Example: "/blog/my-post" -> "blog-my-post"
 */
export const routeToFilename = (route: string): string => {
  return route === "/" ? "index" : route.replace(/^\//, "").replace(/\//g, "-");
};

/**
 * Format a date string to "Month Day, Year" format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Los_Angeles",
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString;
  }
};

// Session storage key for dev product preference (used internally)
const DEV_PRODUCT_STORAGE_KEY = "devProductPreference";

/**
 * Sets the product preference for dev routes
 * @param product The product to set as preference
 */
export function setDevProductPreference(product: ProductName): void {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(DEV_PRODUCT_STORAGE_KEY, product);
  }

  if (typeof document !== "undefined") {
    // Always set the attribute for consistency
    document.documentElement.setAttribute("data-product", product);
  }
}

/**
 * Determines the product from a route path
 * @param path The route path
 * @returns The product name or "mirascope" as default
 */
export function getProductFromPath(path: string): ProductName {
  // Special case for dev routes - check search params and session storage
  if (path.startsWith("/dev")) {
    try {
      // Check the URL for search params if available
      const url = new URL(window.location.href);
      const productParam = url.searchParams.get("product") as ProductName;
      if (productParam && (productParam === "mirascope" || productParam === "lilypad")) {
        return productParam;
      }
    } catch (e) {
      // Ignore any errors when trying to access URL params
    }

    // Then check session storage
    if (typeof sessionStorage !== "undefined") {
      const storedProduct = sessionStorage.getItem(DEV_PRODUCT_STORAGE_KEY) as ProductName;
      if (storedProduct && (storedProduct === "mirascope" || storedProduct === "lilypad")) {
        return storedProduct;
      }
    }
  }

  // Check for docs paths that explicitly mention lilypad
  if (path.startsWith("/docs/lilypad")) {
    return "lilypad";
  }

  // Special case for the pricing page
  if (path.startsWith("/pricing")) {
    return "lilypad";
  }

  // Default to mirascope for all other paths
  return "mirascope";
}
