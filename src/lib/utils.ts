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

/**
 * Determines the product from a route path
 * @param path The route path
 * @returns The product name or "mirascope" as default
 */
export function getProductFromPath(path: string): ProductName {
  // Check for docs paths that explicitly mention lilypad
  if (path.startsWith("/docs/lilypad")) {
    return "lilypad";
  }

  // Special case for the pricing page
  if (path === "/pricing") {
    return "lilypad";
  }

  // Default to mirascope for all other paths
  return "mirascope";
}
