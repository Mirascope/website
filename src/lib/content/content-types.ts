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
  frontmatter: Record<string, any>; // Original parsed frontmatter
  content: string; // Raw MDX with frontmatter stripped
  compiledCode: string; // Processed/compiled MDX code
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
  /**
   * Retrieves content by path
   *
   * @param path - The path to the content
   * @returns The content with its metadata
   */
  getContent(path: string): Promise<Content<T>>;

  /**
   * Gets all metadata for this content type
   *
   * @returns Array of document metadata
   */
  getAllMeta(): Promise<T[]>;
}
