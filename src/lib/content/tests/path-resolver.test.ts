import { describe, test, expect } from "bun:test";
import { normalizePath, isValidPath, resolveContentPath } from "../path-resolver";
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

  describe("resolveContentPath", () => {
    // Test the new function
    test("resolves doc paths in development mode", () => {
      expect(resolveContentPath("/docs/mirascope/getting-started", "doc", { devMode: true })).toBe(
        "/src/docs/mirascope/getting-started.mdx"
      );
    });

    test("resolves doc paths in production mode", () => {
      expect(resolveContentPath("/docs/mirascope/getting-started", "doc", { devMode: false })).toBe(
        "/static/docs/mirascope/getting-started.mdx.json"
      );
    });

    test("resolves URL paths when requested", () => {
      expect(resolveContentPath("/docs/mirascope/getting-started", "doc", { urlPath: true })).toBe(
        "/docs/mirascope/getting-started"
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
});
