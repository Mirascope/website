import type { ContentType } from "./types";

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

export class InvalidPathError extends ContentError {
  constructor(contentType: ContentType, path: string) {
    super(`Invalid ${contentType} path: ${path}`, contentType, path);
    this.name = "InvalidPathError";
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

export class MetadataError extends ContentError {
  constructor(contentType: ContentType, path: string, cause?: Error) {
    super(
      `Failed to process ${contentType} metadata: ${path}${cause ? ` - ${cause.message}` : ""}`,
      contentType,
      path,
      cause
    );
    this.name = "MetadataError";
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
  if (
    error instanceof DocumentNotFoundError ||
    error instanceof InvalidPathError ||
    error instanceof MetadataError ||
    error instanceof ContentError
  ) {
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

/**
 * Validates metadata and throws appropriate error if invalid
 *
 * @param meta - The metadata to validate
 * @param contentType - The type of content being validated
 * @param path - The path to the content
 */
export function validateMetadata<T>(meta: T, contentType: ContentType, path: string): void {
  // Basic validation - check for required fields based on content type
  // This can be expanded as needed
  if (!meta) {
    throw new MetadataError(contentType, path, new Error("Metadata is empty"));
  }
}
