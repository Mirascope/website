import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { normalizePath, buildFilePath, isValidPath, getContentPath } from "../path-resolver";
import { InvalidPathError } from "../errors";
import type { ContentType } from "../content-types";

describe("Path Resolver", () => {
  describe("normalizePath", () => {
    const runTest = (input: string, expected: string, contentType: ContentType = "doc") => {
      test(`normalizes ${input} to ${expected} for ${contentType}`, () => {
        expect(normalizePath(input, contentType)).toBe(expected);
      });
    };

    // Doc paths
    runTest("/docs", "index.mdx");
    runTest("/docs/", "index.mdx");
    runTest("/docs/mirascope", "mirascope.mdx");
    runTest("/docs/mirascope/", "mirascope/index.mdx");
    runTest("/docs/mirascope/getting-started", "mirascope/getting-started.mdx");
    runTest("/docs/mirascope/getting-started/", "mirascope/getting-started/index.mdx");
    runTest("/docs/mirascope/index", "mirascope/index.mdx");
    runTest("/docs/index", "index.mdx");

    // Blog paths
    runTest("/blog", "index.mdx", "blog");
    runTest("/blog/", "index.mdx", "blog");
    runTest("/blog/new-release", "new-release.mdx", "blog");
    runTest("/blog/2023/year-review", "2023/year-review.mdx", "blog");

    // Policy paths
    runTest("/privacy", "privacy.mdx", "policy");
    runTest("/terms/service", "terms/service.mdx", "policy");
    runTest("/terms/use", "terms/use.mdx", "policy");
  });

  describe("buildFilePath", () => {
    test("builds doc file paths", () => {
      expect(buildFilePath("mirascope/getting-started.mdx", "doc")).toBe(
        "/src/docs/mirascope/getting-started.mdx"
      );

      expect(buildFilePath("index.mdx", "doc")).toBe("/src/docs/index.mdx");
    });

    test("builds blog file paths", () => {
      expect(buildFilePath("new-release.mdx", "blog")).toBe("/src/posts/new-release.mdx");

      expect(buildFilePath("2023/year-review.mdx", "blog")).toBe("/src/posts/2023/year-review.mdx");
    });

    test("builds policy file paths", () => {
      expect(buildFilePath("privacy.mdx", "policy")).toBe("/src/policies/privacy.mdx");

      expect(buildFilePath("terms/service.mdx", "policy")).toBe("/src/policies/terms/service.mdx");
    });

    test("throws for invalid content types", () => {
      // @ts-expect-error Testing with invalid type
      expect(() => buildFilePath("test.mdx", "invalid")).toThrow(
        "Unsupported content type: invalid"
      );
    });
  });

  describe("isValidPath", () => {
    test("validates doc paths", () => {
      expect(isValidPath("/docs", "doc")).toBe(true);
      expect(isValidPath("/docs/", "doc")).toBe(true);
      expect(isValidPath("/docs/mirascope", "doc")).toBe(true);
      expect(isValidPath("/docs/mirascope/getting-started", "doc")).toBe(true);

      expect(() => isValidPath("", "doc")).toThrow(InvalidPathError);
      expect(isValidPath("/other", "doc")).toBe(false);
      expect(isValidPath("/blog/post", "doc")).toBe(false);
    });

    test("validates blog paths", () => {
      expect(isValidPath("/blog", "blog")).toBe(true);
      expect(isValidPath("/blog/", "blog")).toBe(true);
      expect(isValidPath("/blog/new-release", "blog")).toBe(true);

      expect(() => isValidPath("", "blog")).toThrow(InvalidPathError);
      expect(isValidPath("/docs/guide", "blog")).toBe(false);
    });

    test("validates policy paths", () => {
      expect(isValidPath("/privacy", "policy")).toBe(true);
      expect(isValidPath("/terms/service", "policy")).toBe(true);

      expect(() => isValidPath("", "policy")).toThrow(InvalidPathError);
      expect(isValidPath("no-leading-slash", "policy")).toBe(false);
    });
  });

  describe("getContentPath", () => {
    // Store the original import.meta.env.PROD value
    const originalProd = import.meta.env.PROD;

    // Mock for production environment
    beforeEach(() => {
      Object.defineProperty(import.meta.env, "PROD", {
        value: true,
        writable: true,
      });
    });

    // Reset the mock after each test
    afterEach(() => {
      Object.defineProperty(import.meta.env, "PROD", {
        value: originalProd,
        writable: true,
      });
    });

    test("generates doc paths in production mode", () => {
      expect(getContentPath("/docs/mirascope/getting-started", "doc")).toBe(
        "/static/docs/mirascope/getting-started.mdx.json"
      );
    });

    test("generates blog paths in production mode", () => {
      expect(getContentPath("/blog/new-release", "blog")).toBe("/static/posts/new-release.json");
    });

    test("generates policy paths in production mode", () => {
      expect(getContentPath("/privacy", "policy")).toBe("/static/policies/privacy.mdx.json");
    });

    test("normalizes backslashes to forward slashes in production mode", () => {
      // Test path with backslashes
      expect(getContentPath("/docs/windows\\style\\path", "doc")).toContain(
        "/static/docs/windows/style"
      );
    });

    test("throws for invalid content types", () => {
      // @ts-expect-error Testing with invalid type
      expect(() => getContentPath("/test", "invalid")).toThrow("Unsupported content type: invalid");
    });

    // Test for development environment
    test("handles development environment paths", () => {
      Object.defineProperty(import.meta.env, "PROD", {
        value: false,
        writable: true,
      });

      // In dev mode, policy paths should be prefixed with /src/policies/
      expect(getContentPath("/privacy", "policy")).toBe("/src/policies/privacy.mdx");

      // In dev mode, doc paths should be prefixed with /src/docs/
      expect(getContentPath("/docs/mirascope/getting-started", "doc")).toBe(
        "/src/docs/mirascope/getting-started.mdx"
      );
    });
  });
});
