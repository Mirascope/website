import { getBlogContent, getAllBlogMeta } from "./blog";
import { getDocContent, getDocsForProduct, getDoc } from "./docs";
import { getPolicy } from "./policy";
import { type ProductName } from "@/lib/route-types";
import { environment } from "./environment";
import type { ContentType, ContentMeta, GetContentFn } from "./types";
import type { ContentLoaderOptions } from "./content-loader";

// Define the route parameters interface
interface RouteParams {
  params: Record<string, string>;
}

/**
 * Creates a content loader function compatible with TanStack Router
 */
function createContentLoader<T extends ContentMeta>(
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

/**
 * Loaders for TanStack Router - these can be imported directly into route files
 */

// Policy loaders - use options from environment for dev mode
export const policyLoader = createContentLoader(getPolicy, "policy", {
  devMode: environment.isDev(),
});

// Doc loaders - use options from environment for dev mode
export const docLoader = createContentLoader(getDocContent, "doc", {
  devMode: environment.isDev(),
});

// Blog loaders - use options from environment for dev mode
export const blogLoader = createContentLoader(getBlogContent, "blog", {
  devMode: environment.isDev(),
});

// Blog list loader
export const blogListLoader = () => {
  return getAllBlogMeta();
};

// Specialized loader for docs that handles routing patterns
export const docsPageLoader = ({
  params,
}: {
  params: { product: string; _splat?: string; section?: string };
}) => {
  const { product, _splat = "", section } = params;

  // Build the document path based on whether we have a section
  const docPath = section ? `/docs/${product}/${section}/${_splat}` : `/docs/${product}/${_splat}`;

  // Clean the path (remove duplicate slashes, trailing slashes)
  const cleanPath = docPath.replace(/\/+/g, "/").replace(/\/$/g, "");

  // Parse the path parts
  const parts = cleanPath.split("/").filter(Boolean);

  // Start with the clean path as the base
  let finalPath = cleanPath;

  // Special case 1: Root product path (e.g., /docs/mirascope)
  if (parts.length <= 2) {
    finalPath = `/docs/${product}/index`;
  }
  // Special case 2: Special sections (api, guides) root paths
  else if (parts.length === 3 && (parts[2] === "api" || parts[2] === "guides")) {
    finalPath = `${cleanPath}/index`;
  }
  // Default case: Normal file or directory
  else if (parts.length > 0) {
    // If no extension is specified, don't modify the path
    // This ensures that paths like /docs/mirascope/learn/provider-specific/openai
    // are passed through to the content handler without appending /index
  }

  return Promise.all([getDoc(finalPath), getDocsForProduct(product as ProductName)]);
};
