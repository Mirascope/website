import type { ContentType } from "./types";

export class ContentError extends Error {
  constructor(
    message: string,
    public contentType: ContentType,
    public path?: string
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
      path
    );
    this.name = "ContentLoadError";
    this.cause = cause;
  }
}

export class MetadataError extends ContentError {
  constructor(contentType: ContentType, path: string, cause?: Error) {
    super(
      `Failed to process ${contentType} metadata: ${path}${cause ? ` - ${cause.message}` : ""}`,
      contentType,
      path
    );
    this.name = "MetadataError";
    this.cause = cause;
  }
}
