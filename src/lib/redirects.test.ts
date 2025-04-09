import { describe, it, expect } from "vitest";
import { processRedirects } from "./redirects";

describe("redirects", () => {
  describe("processRedirects", () => {
    it("should handle exact redirects", () => {
      expect(processRedirects("/WELCOME")).toBe("/docs/mirascope");
      expect(processRedirects("/WHY")).toBe("/docs/mirascope/getting-started/why");
      expect(processRedirects("/learn")).toBe("/docs/mirascope/learn");
    });

    it("should handle pattern redirects", () => {
      expect(processRedirects("/learn/prompts")).toBe("/docs/mirascope/learn/prompts");
      expect(processRedirects("/learn/tools")).toBe("/docs/mirascope/learn/tools");
      expect(processRedirects("/learn/mcp/client")).toBe("/docs/mirascope/learn/mcp/client");
      expect(processRedirects("/post/some-blog-post")).toBe("/blog/some-blog-post");
      expect(processRedirects("/docs/something")).toBe("/something");
    });

    it("should return null for non-redirected paths", () => {
      expect(processRedirects("/blog")).toBeNull();
      expect(processRedirects("/docs/mirascope")).toBeNull();
      expect(processRedirects("/privacy")).toBeNull();
      expect(processRedirects("/")).toBeNull();
      expect(processRedirects("/some-random-path")).toBeNull();
    });

    it("should handle paths with or without trailing slashes", () => {
      expect(processRedirects("/WELCOME/")).toBe("/docs/mirascope");
      expect(processRedirects("/learn/")).toBe("/docs/mirascope/learn");
    });
  });
});
