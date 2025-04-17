import { getBlogContent, getAllBlogMeta } from "./blog";
import { getDocContent, getDocsForProduct, getDoc } from "./docs";
import { getPolicy } from "./policy";
import { createContentLoader } from "./loader-utils";
import { type ProductName } from "@/lib/route-types";

/**
 * Loaders for TanStack Router - these can be imported directly into route files
 */

// Policy loaders
export const policyLoader = createContentLoader(getPolicy, "policy");

// Doc loaders
export const docLoader = createContentLoader(getDocContent, "doc");

// Blog loaders
export const blogLoader = createContentLoader(getBlogContent, "blog");

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

  console.log(`Loading docs path: ${finalPath}`);

  return Promise.all([getDoc(finalPath), getDocsForProduct(product as ProductName)]);
};
