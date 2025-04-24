/**
 * Unified content service
 *
 * Provides centralized functions for loading content and metadata
 * across all content types (blog, docs, policy)
 */

import type {
  BlogMeta,
  DocMeta,
  PolicyMeta,
  BlogContent,
  DocContent,
  PolicyContent,
  ContentMeta,
  Content,
  ContentType,
} from "./content-types";
import { environment } from "./environment";
import { processDocSpec } from "./spec";

import { processMDXContent } from "./mdx-processor";

// Import docs specification
import docsSpec from "@/content/doc/_meta";

// Re-export content types
export type { BlogMeta, DocMeta, PolicyMeta, BlogContent, DocContent, PolicyContent };

// Define known policy paths

/* ========= CONTENT LOADING ========== */

/**
 * Maps a URL path to a content JSON file path
 * Automatically determines the content type from the path
 *
 * @param path - The URL path to resolve
 * @returns Resolved path to JSON content file
 */
function resolveContentPath(path: string, type: ContentType): string {
  if (!path) {
    throw new Error("Path cannot be empty");
  }
  if (path.startsWith("/")) {
    path = path.slice(1); // Remove leading slash
  }

  path = !path.startsWith(`${type}/`) ? `${type}/${path}` : path;

  if (path.endsWith("/")) {
    path = `${path}index`;
  }

  // Return the full path to the content file
  return `/static/content/${path}.json`;
}

/**
 * Unified content loading pipeline that gets preprocessed content from JSON
 * and processes it for rendering
 */
export async function loadContent<T extends ContentMeta>(
  path: string,
  contentType: ContentType
): Promise<Content<T>> {
  try {
    // Get content path
    const contentPath = resolveContentPath(path, contentType);

    // Fetch content JSON file
    const response = await environment.fetch(contentPath);

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
    }

    // Get the JSON data containing meta and content
    const data = await response.json();

    // Raw content from JSON (includes frontmatter)
    const rawContent = data.content;

    // Process MDX for rendering
    const processed = await processMDXContent(rawContent, contentType, {
      path: path,
    });

    // Use the metadata from preprocessing - no need to recreate it
    const meta = data.meta as T;

    // Return complete content
    return {
      meta,
      content: processed.content,
      mdx: {
        code: processed.code,
        frontmatter: processed.frontmatter,
      },
    };
  } catch (error) {
    return handleContentError(error, contentType, path);
  }
}

/* ========== BLOG CONTENT ========== */

/**
 * Get blog content by path
 */
export async function getBlogContent(slug: string): Promise<BlogContent> {
  return loadContent<BlogMeta>(slug, "blog");
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
  return loadContent<DocMeta>(path, "doc");
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

const KNOWN_POLICY_PATHS = ["privacy", "terms/service", "terms/use"];

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

// Error Handling

export class ContentError extends Error {
  constructor(
    message: string,
    public contentType: ContentType,
    public path?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = "ContentError";
  }
}

export class DocumentNotFoundError extends ContentError {
  constructor(contentType: ContentType, path: string) {
    super(`${contentType} document not found: ${path}`, contentType, path);
    this.name = "DocumentNotFoundError";
  }
}

export class ContentLoadError extends ContentError {
  constructor(contentType: ContentType, path: string, cause?: Error) {
    super(
      `Failed to load ${contentType} content: ${path}${cause ? ` - ${cause.message}` : ""}`,
      contentType,
      path,
      cause
    );
    this.name = "ContentLoadError";
  }
}

/**
 * Handles content errors consistently, classifying unknown errors
 * and wrapping them in appropriate error types
 *
 * @param error - The error to handle
 * @param contentType - The type of content being processed
 * @param path - The path to the content
 * @throws A well-typed error with consistent format
 */
export function handleContentError(error: unknown, contentType: ContentType, path: string): never {
  // Handle known error types
  if (error instanceof DocumentNotFoundError || error instanceof ContentError) {
    throw error;
  }

  // Check for 404-like errors
  if (
    error instanceof Error &&
    (error.message.includes("404") ||
      error.message.includes("not found") ||
      error.message.includes("ENOENT"))
  ) {
    throw new DocumentNotFoundError(contentType, path);
  }

  // Wrap other errors
  throw new ContentLoadError(
    contentType,
    path,
    error instanceof Error ? error : new Error(String(error))
  );
}
