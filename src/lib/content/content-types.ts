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

// Document with its metadata
export interface ContentWithMeta {
  meta: ContentMeta;
  content: string;
}

// Result of document validation
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
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

// Type-specific document types
export type DocWithContent = ContentWithMeta & { meta: DocMeta };
export type BlogWithContent = ContentWithMeta & { meta: BlogMeta };
export type PolicyWithContent = ContentWithMeta & { meta: PolicyMeta };
