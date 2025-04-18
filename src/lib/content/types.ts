// Core content type enum
export type ContentType = "doc" | "blog" | "policy";

// Base metadata interface
export interface ContentMeta {
  title: string;
  description?: string;
  path: string;
  slug: string;
  type: ContentType;
}

// Base content interface with metadata plus content
export interface Content<T extends ContentMeta = ContentMeta> {
  meta: T; // Typed, validated metadata
  content: string; // Raw MDX with frontmatter stripped

  // MDX structure expected by components
  mdx: {
    code: string;
    frontmatter: Record<string, any>;
  };
}

// Result of validation
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
 * Type for content retrieval function
 */
export type GetContentFn<T extends ContentMeta> = (
  path: string,
  options?: { customFetch?: typeof fetch; devMode?: boolean }
) => Promise<Content<T>>;

/**
 * Type for metadata retrieval function
 */
export type GetMetaFn<T extends ContentMeta> = (options?: {
  customFetch?: typeof fetch;
  devMode?: boolean;
}) => Promise<T[]>;
