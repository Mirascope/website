import type { ContentType, ContentMeta, Content } from "./types";

// Define the route parameters interface
interface RouteParams {
  params: Record<string, string>;
}

/**
 * Creates a content loader function compatible with TanStack Router
 */
export function createContentLoader<T extends ContentMeta>(
  getContentFn: (path: string) => Promise<Content<T>>,
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
