import { getBlogContent, getAllBlogMeta } from "./blog";
import { getPolicy } from "./policy";
import type { ContentType, ContentMeta, GetContentFn } from "./content-types";

// Define the route parameters interface
interface RouteParams {
  params: Record<string, string>;
}

/**
 * Loaders for TanStack Router - these can be imported directly into route files
 */

export const policyLoader = createContentLoader(getPolicy, "policy");

export const blogLoader = createContentLoader(getBlogContent, "blog");

// Blog list loader
export const blogListLoader = () => {
  return getAllBlogMeta();
};

/**
 * Creates a content loader function compatible with TanStack Router
 */
function createContentLoader<T extends ContentMeta>(
  getContentFn: GetContentFn<T>,
  contentType: ContentType
) {
  return ({ params }: RouteParams) => {
    const path = getPathFromParams(params, contentType);
    return getContentFn(path);
  };
}

/**
 * Derives the content path from route parameters based on content type
 */
function getPathFromParams(params: Record<string, string>, contentType: ContentType): string {
  switch (contentType) {
    case "blog":
      return params.slug ? `/blog/${params.slug}` : "";
    case "doc":
      // Handle nested doc paths
      const product = params.product;
      const path = params["*"] || "";
      return `/doc/${product}/${path}`;
    case "policy":
      // Handle policy paths
      if (params.slug === "privacy") {
        return "/policy/privacy";
      }
      // Handle terms paths
      if (params.policy) {
        return `/policy/terms/${params.policy}`;
      }
      return "";
    default:
      return "";
  }
}
