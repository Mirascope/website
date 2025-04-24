/**
 * Unified Content Service
 *
 * This module provides a centralized service for loading and managing various
 * content types (blogs, docs, policies) with a consistent interface.
 *
 * The service handles:
 * - Content type definitions and metadata interfaces
 * - Content loading from static JSON files
 * - MDX processing and rendering
 * - Structured error handling
 * - Type-specific content operations
 */

import { environment } from "./environment";
import { processDocSpec } from "./spec";
import { processMDXContent } from "./mdx-processing";

// Import docs specification
import docsSpec from "@/content/doc/_meta";

/* ========== CONTENT TYPES =========== */

/**
 * All recognized content types in the system
 * Each type is mapped to:
 * - Source directory: content/{type}
 * - Output directory: static/content/{type}
 * - Metadata file: static/content-meta/{type}/index.json
 */
export type ContentType = "doc" | "blog" | "policy" | "dev";
export const CONTENT_TYPES: ContentType[] = ["doc", "blog", "policy", "dev"];

/**
 * Base metadata interface that all content types extend
 * This metadata is generated during preprocessing and stored with the content
 */
export interface ContentMeta {
  title: string;
  description: string;
  path: string;
  slug: string;
  type: ContentType;
}

/**
 * Core content interface that combines metadata with content
 * The meta and content are loaded from JSON, with MDX processed on demand
 */
export interface Content<T extends ContentMeta = ContentMeta> {
  meta: T; // Typed, validated metadata
  content: string; // MDX with frontmatter stripped out

  // MDX structure expected by components (used in MDXRenderer)
  mdx: {
    code: string; // Compiled MDX code
    frontmatter: Record<string, any>; // Extracted frontmatter
  };
}

/* ========== BLOG CONTENT TYPES =========== */

/**
 * Blog-specific metadata extends the base ContentMeta
 */
export interface BlogMeta extends ContentMeta {
  date: string; // Publication date in YYYY-MM-DD format
  author: string; // Author name
  readTime: string; // Estimated reading time
  lastUpdated: string; // Last update date
}

export type BlogContent = Content<BlogMeta>;

/* ========== DOC CONTENT TYPES =========== */

/**
 * Documentation-specific metadata extends the base ContentMeta
 */
export interface DocMeta extends ContentMeta {
  product: string; // Which product this doc belongs to
  hasExtractableSnippets: boolean; // Whether this doc has code snippets that can be extracted
}

export type DocContent = Content<DocMeta>;

/* ========== POLICY CONTENT TYPES =========== */

/**
 * Policy-specific metadata extends the base ContentMeta
 */
export interface PolicyMeta extends ContentMeta {
  lastUpdated: string; // Last update date of the policy
}

export type PolicyContent = Content<PolicyMeta>;

/* ========== ERROR HANDLING =========== */

/**
 * Base content error class for consistent error handling
 */
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

/**
 * Specific error for document not found conditions
 */
export class DocumentNotFoundError extends ContentError {
  constructor(contentType: ContentType, path: string) {
    super(`${contentType} document not found: ${path}`, contentType, path);
    this.name = "DocumentNotFoundError";
  }
}

/**
 * Specific error for content loading failures
 */
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

/* ========== CORE CONTENT LOADING =========== */

/**
 * Maps a URL path to a content JSON file path
 * Ensures the path has the correct format with type prefix
 *
 * @param path - The URL path to resolve
 * @param type - The content type
 * @returns Resolved path to JSON content file
 */
function resolveContentPath(path: string, type: ContentType): string {
  if (!path) {
    throw new Error("Path cannot be empty");
  }

  // Remove leading slash if present
  if (path.startsWith("/")) {
    path = path.slice(1);
  }

  // Ensure path has the content type prefix
  path = !path.startsWith(`${type}/`) ? `${type}/${path}` : path;

  // Handle trailing slash as index
  if (path.endsWith("/")) {
    path = `${path}index`;
  }

  // Return the full path to the content file
  return `/static/content/${path}.json`;
}

/**
 * Core content loading function used by all content types
 *
 * This function implements the unified content loading pipeline:
 * 1. Resolves the content path from the URL path
 * 2. Fetches the preprocessed JSON file
 * 3. Processes the MDX content for rendering
 * 4. Combines metadata and processed content
 *
 * @param path - URL path for the content
 * @param contentType - Type of content being loaded
 * @returns Fully processed content ready for rendering
 * @throws ContentError or derived errors on failures
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

/* ========== BLOG CONTENT OPERATIONS =========== */

/**
 * Get blog content by slug
 *
 * @param slug - The blog post slug or path
 * @returns The fully processed blog content
 */
export async function getBlogContent(slug: string): Promise<BlogContent> {
  return loadContent<BlogMeta>(slug, "blog");
}

/**
 * Get all blog post metadata
 *
 * Retrieves the complete list of blog metadata from the index file,
 * which is pre-sorted by date (newest first)
 *
 * @returns Array of blog metadata objects
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

/* ========== DOC CONTENT OPERATIONS =========== */

/**
 * Get documentation content by path
 *
 * @param path - The document path
 * @returns The fully processed document content
 */
export async function getDocContent(path: string): Promise<DocContent> {
  return loadContent<DocMeta>(path, "doc");
}

/**
 * Get all documentation metadata from the specification
 *
 * Processes the docs specification to generate metadata for all available docs
 *
 * @returns Array of document metadata objects
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
 *
 * @param product - The product identifier
 * @returns Array of document metadata objects for the specified product
 */
export function getDocsForProduct(product: string): DocMeta[] {
  const allDocs = getAllDocMeta();
  return allDocs.filter((doc) => doc.product === product);
}

/**
 * Get sections for a product
 *
 * @param product - The product identifier
 * @returns Array of section objects with slug and title
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

/* ========== POLICY CONTENT OPERATIONS =========== */

/**
 * List of known policy paths in the system
 */
const KNOWN_POLICY_PATHS = ["privacy", "terms/service", "terms/use"];

/**
 * Get policy content by path
 *
 * @param path - The policy document path
 * @returns The fully processed policy content
 */
export async function getPolicy(path: string): Promise<PolicyContent> {
  return loadContent<PolicyMeta>(path, "policy");
}

/**
 * Get all policy metadata
 *
 * @returns Array of policy metadata objects
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
 *
 * @param policyPath - The path to the policy to load
 * @returns A function that loads the specified policy
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
