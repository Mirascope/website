import { describe, test, expect } from "bun:test";
import { processRedirects } from "./redirects";

describe("redirects", () => {
  describe("processRedirects", () => {
    test("should handle exact redirects", () => {
      expect(processRedirects("/WELCOME")).toBe("/docs/mirascope");
      expect(processRedirects("/WHY")).toBe("/docs/mirascope/getting-started/why");
      expect(processRedirects("/learn")).toBe("/docs/mirascope/learn");
    });

    test("should handle pattern redirects", () => {
      expect(processRedirects("/learn/prompts")).toBe("/docs/mirascope/learn/prompts");
      expect(processRedirects("/learn/tools")).toBe("/docs/mirascope/learn/tools");
      expect(processRedirects("/learn/mcp/client")).toBe("/docs/mirascope/learn/mcp/client");
      expect(processRedirects("/post/some-blog-post")).toBe("/blog/some-blog-post");
    });

    test("should redirect /docs/{invalid-product} to /docs/mirascope", () => {
      expect(processRedirects("/docs/invalid-product")).toBe("/docs/mirascope");
      expect(processRedirects("/docs/unknown")).toBe("/docs/mirascope");
      expect(processRedirects("/docs/invalid-product/some/path")).toBe("/docs/mirascope");
    });

    test("should return null for non-redirected paths", () => {
      expect(processRedirects("/blog")).toBeNull();
      expect(processRedirects("/docs/mirascope")).toBeNull();
      expect(processRedirects("/docs/lilypad")).toBeNull();
      expect(processRedirects("/privacy")).toBeNull();
      expect(processRedirects("/")).toBeNull();
      expect(processRedirects("/some-random-path")).toBeNull();
    });

    test("should handle paths with or without trailing slashes", () => {
      expect(processRedirects("/WELCOME/")).toBe("/docs/mirascope");
      expect(processRedirects("/learn/")).toBe("/docs/mirascope/learn");
    });
  });
});
