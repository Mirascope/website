import type {
  ContentType,
  ContentMeta,
  ContentWithMeta,
  DocMeta,
  BlogMeta,
  PolicyMeta,
} from "@/lib/content/content-types";

/**
 * Interface for type-specific content handlers
 */
export interface ContentTypeHandler<T extends ContentMeta> {
  /**
   * Retrieves a document by path
   *
   * @param path - The path to the document
   * @returns The document with its metadata
   */
  getDocument(path: string): Promise<ContentWithMeta & { meta: T }>;

  /**
   * Gets all documents of this content type
   *
   * @param filter - Optional filter function
   * @returns Array of document metadata
   */
  getAllDocuments(filter?: (meta: T) => boolean): Promise<T[]>;

  /**
   * Gets documents for a specific collection
   *
   * @param collection - The collection identifier
   * @returns Array of document metadata
   */
  getDocumentsForCollection(collection: string): Promise<T[]>;
}

/**
 * Type mapping from content types to their corresponding metadata types
 */
export type ContentTypeToMeta<T extends ContentType> = T extends "doc"
  ? DocMeta
  : T extends "blog"
    ? BlogMeta
    : T extends "policy"
      ? PolicyMeta
      : never;

/**
 * Map of content types to their handlers, ensuring all content types are covered
 */
export type ContentTypeHandlerMap = {
  [K in ContentType]: ContentTypeHandler<ContentTypeToMeta<K>>;
};
