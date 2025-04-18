import { describe, test, expect } from "bun:test";
import { processRedirects } from "./redirects";

describe("redirects", () => {
  describe("processRedirects", () => {
    test("should handle exact redirects", () => {
      expect(processRedirects("/docs")).toBe("/docs/mirascope");
      expect(processRedirects("/docs/")).toBe("/docs/mirascope");
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
      // These paths are now handled by Cloudflare redirects
      expect(processRedirects("/WELCOME")).toBeNull();
      expect(processRedirects("/WHY")).toBeNull();
      expect(processRedirects("/learn")).toBeNull();
      expect(processRedirects("/learn/prompts")).toBeNull();
    });
  });
});
