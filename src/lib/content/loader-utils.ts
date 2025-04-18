import type { ContentType, ContentMeta, GetContentFn } from "./types";
import type { ContentLoaderOptions } from "./content-loader";

// Define the route parameters interface
interface RouteParams {
  params: Record<string, string>;
}

/**
 * Creates a content loader function compatible with TanStack Router
 */
export function createContentLoader<T extends ContentMeta>(
  getContentFn: GetContentFn<T>,
  contentType: ContentType,
  options?: ContentLoaderOptions
) {
  return ({ params }: RouteParams) => {
    const path = getPathFromParams(params, contentType);
    return getContentFn(path, options);
  };
}

/**
 * Derives the content path from route parameters based on content type
 */
export function getPathFromParams(
  params: Record<string, string>,
  contentType: ContentType
): string {
  switch (contentType) {
    case "blog":
      return params.slug ? `/blog/${params.slug}` : "";
    case "doc":
      // Handle nested doc paths
      const product = params.product;
      const path = params["*"] || "";
      return `/docs/${product}/${path}`;
    case "policy":
      // Handle policy paths
      if (params.slug === "privacy") {
        return "privacy";
      }
      // Handle terms paths
      if (params.policy) {
        return `terms/${params.policy}`;
      }
      return "";
    default:
      return "";
  }
}
