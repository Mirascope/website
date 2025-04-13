import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
