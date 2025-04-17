import { getBlogContent, getAllBlogMeta } from "./blog";
import { getDocContent } from "./docs";
import { getPolicy } from "./policy";
import { createContentLoader } from "./loader-utils";

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
