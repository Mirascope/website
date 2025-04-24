/**
 * Unified content service
 *
 * Provides centralized functions for loading content and metadata
 * across all content types (blog, docs, policy)
 */

import { loadContent } from "./content-loader";
import type {
  BlogMeta,
  DocMeta,
  PolicyMeta,
  BlogContent,
  DocContent,
  PolicyContent,
} from "./content-types";
import { environment } from "./environment";
import { ContentError } from "./errors";
import { processDocSpec } from "./spec";

// Import docs specification
import docsSpec from "@/content/doc/_meta";

// Re-export content types
export type { BlogMeta, DocMeta, PolicyMeta, BlogContent, DocContent, PolicyContent };

// Define known policy paths
const KNOWN_POLICY_PATHS = ["privacy", "terms/service", "terms/use"];

/* ========== BLOG CONTENT ========== */

/**
 * Normalize a blog slug to ensure it has the proper prefix
 */
function normalizeBlogPath(slug: string): string {
  return slug.startsWith("/blog/") ? slug : `/blog/${slug}`;
}

/**
 * Get blog content by path
 */
export async function getBlogContent(slug: string): Promise<BlogContent> {
  const normalizedSlug = normalizeBlogPath(slug);
  return loadContent<BlogMeta>(normalizedSlug, "blog");
}

/**
 * Get all blog metadata
 */
export async function getAllBlogMeta(): Promise<BlogMeta[]> {
  try {
    // Both development and production use the same static file now
    const response = await environment.fetch("/static/content-meta/blog/index.json");
    if (!response.ok) {
      throw new Error(`Error fetching blog metadata: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching posts metadata:", error);
    throw new ContentError(
      `Failed to fetch posts metadata: ${error instanceof Error ? error.message : String(error)}`,
      "blog",
      undefined
    );
  }
}

/* ========== DOC CONTENT ========== */

/**
 * Get doc content by path using the spec format
 */
export async function getDocContent(path: string): Promise<DocContent> {
  // Normalize to doc/ prefix format
  const docPath = !path.startsWith("/doc/") ? `/doc/${path}` : path;
  return loadContent<DocMeta>(docPath, "doc");
}

/**
 * Get all docs metadata from the specification
 */
export function getAllDocMeta(): DocMeta[] {
  const allDocs: DocMeta[] = [];

  // Process each product in the spec
  Object.entries(docsSpec).forEach(([product, productSpec]) => {
    // Process all sections
    productSpec.sections.forEach((section) => {
      // For the default section (index), don't add a section slug prefix
      const isDefaultSection = section.slug === "index";
      const sectionPathPrefix = isDefaultSection ? product : `${product}/${section.slug}`;

      // Process each document in this section
      section.children.forEach((docSpec) => {
        const docItems = processDocSpec(docSpec, product, sectionPathPrefix);
        allDocs.push(...docItems);
      });
    });
  });

  return allDocs;
}

/**
 * Get docs for a specific product
 */
export function getDocsForProduct(product: string): DocMeta[] {
  const allDocs = getAllDocMeta();
  return allDocs.filter((doc) => doc.product === product);
}

/**
 * Get sections for a product
 */
export function getSectionsForProduct(product: string): { slug: string; title: string }[] {
  // Get all sections from the spec
  const productSpec = docsSpec[product];
  if (!productSpec) {
    return [];
  }

  return productSpec.sections.map((section) => ({
    slug: section.slug,
    title: section.label,
  }));
}

/* ========== POLICY CONTENT ========== */

/**
 * Get policy content by path
 */
export async function getPolicy(path: string): Promise<PolicyContent> {
  return loadContent<PolicyMeta>(path, "policy");
}

/**
 * Get all policy metadata
 */
export async function getAllPolicyMeta(): Promise<PolicyMeta[]> {
  try {
    // For policies, we have a known set of paths
    const policies: PolicyMeta[] = [];

    for (const path of KNOWN_POLICY_PATHS) {
      try {
        const policy = await getPolicy(path);
        policies.push(policy.meta);
      } catch (error) {
        console.error(`Error loading policy at path ${path}:`, error);
        // Skip this policy and continue with others
      }
    }

    return policies;
  } catch (error) {
    throw new ContentError(
      `Failed to get all policy documents: ${error instanceof Error ? error.message : String(error)}`,
      "policy",
      undefined
    );
  }
}

/**
 * Get policies in a specific collection
 */
export async function getPoliciesInCollection(collection: string): Promise<PolicyMeta[]> {
  try {
    // Get all policies
    const allPolicies = await getAllPolicyMeta();

    // Filter by collection (e.g., "terms")
    return allPolicies.filter((policy) => {
      const pathParts = policy.path.split("/");
      return pathParts.length > 1 && pathParts[0] === collection;
    });
  } catch (error) {
    throw new ContentError(
      `Failed to get policy documents for collection ${collection}: ${error instanceof Error ? error.message : String(error)}`,
      "policy",
      undefined
    );
  }
}

/**
 * Creates a loader function for a policy page
 * This makes it easy to inline policy loaders in route files
 */
export function createPolicyLoader(policyPath: string) {
  return async () => {
    try {
      return await getPolicy(policyPath);
    } catch (error) {
      console.error(`Error loading policy: ${policyPath}`, error);
      throw error;
    }
  };
}
