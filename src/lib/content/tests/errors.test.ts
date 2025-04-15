import { describe, test, expect } from "bun:test";
import {
  ContentError,
  DocumentNotFoundError,
  InvalidPathError,
  ContentLoadError,
  MetadataError,
} from "../errors";

describe("Error Types", () => {
  describe("ContentError", () => {
    test("creates a basic content error", () => {
      const error = new ContentError("Test error", "doc", "test/path");

      expect(error.message).toBe("Test error");
      expect(error.name).toBe("ContentError");
      expect(error.contentType).toBe("doc");
      expect(error.path).toBe("test/path");
      expect(error instanceof Error).toBe(true);
    });

    test("works without path", () => {
      const error = new ContentError("Generic error", "blog");

      expect(error.message).toBe("Generic error");
      expect(error.contentType).toBe("blog");
      expect(error.path).toBeUndefined();
    });
  });

  describe("DocumentNotFoundError", () => {
    test("creates a not found error", () => {
      const error = new DocumentNotFoundError("doc", "test/path");

      expect(error.message).toBe("doc document not found: test/path");
      expect(error.name).toBe("DocumentNotFoundError");
      expect(error.contentType).toBe("doc");
      expect(error.path).toBe("test/path");
      expect(error instanceof ContentError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe("InvalidPathError", () => {
    test("creates an invalid path error", () => {
      const error = new InvalidPathError("blog", "invalid/path");

      expect(error.message).toBe("Invalid blog path: invalid/path");
      expect(error.name).toBe("InvalidPathError");
      expect(error.contentType).toBe("blog");
      expect(error.path).toBe("invalid/path");
      expect(error instanceof ContentError).toBe(true);
    });
  });

  describe("ContentLoadError", () => {
    test("creates a content load error", () => {
      const error = new ContentLoadError("policy", "terms/service");

      expect(error.message).toBe("Failed to load policy content: terms/service");
      expect(error.name).toBe("ContentLoadError");
      expect(error.contentType).toBe("policy");
      expect(error.path).toBe("terms/service");
      expect(error instanceof ContentError).toBe(true);
    });

    test("includes cause in message", () => {
      const cause = new Error("Network error");
      const error = new ContentLoadError("doc", "mirascope/intro", cause);

      expect(error.message).toBe("Failed to load doc content: mirascope/intro - Network error");
      expect(error.cause).toBe(cause);
    });
  });

  describe("MetadataError", () => {
    test("creates a metadata processing error", () => {
      const error = new MetadataError("blog", "post-slug");

      expect(error.message).toBe("Failed to process blog metadata: post-slug");
      expect(error.name).toBe("MetadataError");
      expect(error.contentType).toBe("blog");
      expect(error.path).toBe("post-slug");
      expect(error instanceof ContentError).toBe(true);
    });

    test("includes cause in message", () => {
      const cause = new Error("Invalid frontmatter");
      const error = new MetadataError("policy", "privacy", cause);

      expect(error.message).toBe(
        "Failed to process policy metadata: privacy - Invalid frontmatter"
      );
      expect(error.cause).toBe(cause);
    });
  });

  describe("Error inheritance", () => {
    test("allows catching specific error types", () => {
      const docNotFoundError = new DocumentNotFoundError("doc", "path");
      const invalidPathError = new InvalidPathError("blog", "path");
      const contentLoadError = new ContentLoadError("policy", "path");

      // ContentError catches all derived types
      expect(docNotFoundError instanceof ContentError).toBe(true);
      expect(invalidPathError instanceof ContentError).toBe(true);
      expect(contentLoadError instanceof ContentError).toBe(true);

      // But specific types don't catch each other
      expect(docNotFoundError instanceof InvalidPathError).toBe(false);
      expect(invalidPathError instanceof ContentLoadError).toBe(false);
    });
  });
});
