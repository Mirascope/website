import type { ProductName } from "@/src/lib/content/spec";

/**
 * Metadata System Types
 *
 * This file contains types for the metadata management system.
 */

/**
 * Base type for meta tags
 */
export type MetaTag = {
  name?: string;
  property?: string;
  content?: string;
  httpEquiv?: string;
  charset?: string;
  // Other meta attributes as needed
};

/**
 * Base type for link tags
 */
export type LinkTag = {
  rel?: string;
  href?: string;
  sizes?: string;
  type?: string;
  crossOrigin?: string;
  as?: string;
  // Other link attributes as needed
};

/**
 * Raw metadata extracted from components
 * Does not require title or description
 */
export type RawMetadata = {
  title?: string;
  description?: string;
  metaTags: MetaTag[];
  linkTags: LinkTag[];
};

/**
 * Complete, unified metadata structure
 * Required fields for final output
 */
export type UnifiedMetadata = {
  title: string; // Required
  description: string; // Required
  metaTags: MetaTag[];
  linkTags: LinkTag[];
};

/**
 * Props for BaseMeta component
 */
export interface BaseMetaProps {
  children?: React.ReactNode;
}

/**
 * Props for RouteMeta component
 */
export interface RouteMetaProps {
  children?: React.ReactNode;
}

/**
 * Props for PageMeta component (high-level API)
 */
export interface PageMetaProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  product?: ProductName;
  robots?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tags?: string[];
  };
}

/**
 * Internal Type for Serialized Metadata
 */
export interface SerializedMetadata {
  base64: string;
}
