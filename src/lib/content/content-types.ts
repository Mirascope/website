// Core content type enum
export type ContentType = "doc" | "blog" | "policy" | "dev";

/**
 * Array of all recognized content types in the system
 * Each type will have:
 * - Source directory: content/{type}
 * - Output directory: static/content/{type}
 * - Metadata file: static/content-meta/{type}/index.json
 */
export const CONTENT_TYPES: ContentType[] = ["doc", "blog", "policy", "dev"];

// Base metadata interface
export interface ContentMeta {
  title: string;
  description?: string;
  path: string;
  slug: string;
  type: ContentType;
}

// Type-specific metadata extensions
export interface DocMeta extends ContentMeta {
  product: string;
  section?: string;
  group?: string;
  sectionTitle?: string;
  groupTitle?: string;
}

export interface FutureDocMeta extends ContentMeta {
  product: string;
  hasExtractableSnippets: boolean;
}

export interface BlogMeta extends ContentMeta {
  date: string;
  author: string;
  readTime: string;
  lastUpdated?: string;
}

export interface PolicyMeta extends ContentMeta {
  lastUpdated?: string;
}

// Base content interface with metadata plus content
export interface Content<T extends ContentMeta = ContentMeta> {
  meta: T; // Typed, validated metadata
  content: string; // Raw MDX with frontmatter stripped

  // MDX structure expected by components (this is used in MDXRenderer)
  mdx: {
    code: string;
    frontmatter: Record<string, any>;
  };
}

// Type-specific content types
export type BlogContent = Content<BlogMeta>;
export type DocContent = Content<DocMeta>;
export type PolicyContent = Content<PolicyMeta>;

// Result of document validation
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

// Result type for content operations
export interface ContentResult<T extends ContentMeta = ContentMeta> {
  content: Content<T> | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Interface for content handlers
 */
export interface ContentHandler<T extends ContentMeta> {
  getContent(path: string): Promise<Content<T>>;
  getAllMeta(): Promise<T[]>;
}

/**
 * Type for content retrieval function
 */
export type GetContentFn<T extends ContentMeta> = (path: string) => Promise<Content<T>>;

/**
 * Type for metadata retrieval function
 */
export type GetMetaFn<T extends ContentMeta> = () => Promise<T[]>;
