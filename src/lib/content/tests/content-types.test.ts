import { describe, it, expect } from "vitest";
import type { ContentType, ContentMeta, ValidationResult } from "../types";
import type { DocMeta } from "../docs";
import type { BlogMeta } from "../blog";
import type { PolicyMeta } from "../policy";

describe("ContentTypes", () => {
  describe("ContentType", () => {
    it("defines valid content types", () => {
      const docType: ContentType = "doc";
      const blogType: ContentType = "blog";
      const policyType: ContentType = "policy";

      expect(docType).toBe("doc");
      expect(blogType).toBe("blog");
      expect(policyType).toBe("policy");
    });
  });

  describe("ContentMeta", () => {
    it("works with minimal properties", () => {
      const meta: ContentMeta = {
        title: "Test Title",
        path: "test/path",
        slug: "test-path",
        type: "doc",
      };

      expect(meta.title).toBe("Test Title");
      expect(meta.path).toBe("test/path");
      expect(meta.slug).toBe("test-path");
      expect(meta.type).toBe("doc");
    });

    it("accepts optional description", () => {
      const meta: ContentMeta = {
        title: "Test Title",
        description: "Test Description",
        path: "test/path",
        slug: "test-path",
        type: "doc",
      };

      expect(meta.description).toBe("Test Description");
    });
  });

  describe("DocMeta", () => {
    it("works with required properties", () => {
      const meta: DocMeta = {
        title: "Test Doc",
        path: "mirascope/getting-started",
        slug: "getting-started",
        type: "doc",
        product: "mirascope",
      };

      expect(meta.title).toBe("Test Doc");
      expect(meta.product).toBe("mirascope");
    });

    it("accepts optional properties", () => {
      const meta: DocMeta = {
        title: "Test Doc",
        path: "mirascope/getting-started",
        slug: "getting-started",
        type: "doc",
        product: "mirascope",
        section: "introduction",
        group: "basics",
        sectionTitle: "Introduction",
        groupTitle: "Basics",
      };

      expect(meta.section).toBe("introduction");
      expect(meta.group).toBe("basics");
      expect(meta.sectionTitle).toBe("Introduction");
      expect(meta.groupTitle).toBe("Basics");
    });
  });

  describe("BlogMeta", () => {
    it("works with all properties", () => {
      const meta: BlogMeta = {
        title: "Test Blog Post",
        path: "test-blog-post",
        slug: "test-blog-post",
        type: "blog",
        date: "2023-01-01",
        author: "Test Author",
        readTime: "5 min",
        lastUpdated: "2023-02-01",
      };

      expect(meta.title).toBe("Test Blog Post");
      expect(meta.date).toBe("2023-01-01");
      expect(meta.author).toBe("Test Author");
      expect(meta.readTime).toBe("5 min");
      expect(meta.lastUpdated).toBe("2023-02-01");
    });
  });

  describe("PolicyMeta", () => {
    it("works with minimal properties", () => {
      const meta: PolicyMeta = {
        title: "Privacy Policy",
        path: "privacy",
        slug: "privacy",
        type: "policy",
      };

      expect(meta.title).toBe("Privacy Policy");
    });

    it("accepts lastUpdated property", () => {
      const meta: PolicyMeta = {
        title: "Privacy Policy",
        path: "privacy",
        slug: "privacy",
        type: "policy",
        lastUpdated: "2023-01-01",
      };

      expect(meta.lastUpdated).toBe("2023-01-01");
    });
  });

  describe("Content", () => {
    it("combines metadata with content and mdx", () => {
      const document = {
        meta: {
          title: "Test Title",
          path: "test/path",
          slug: "test-path",
          type: "doc" as ContentType,
        },
        content: "# Test Content",
        mdx: {
          code: "compiled code",
          frontmatter: { title: "Test Title" },
        },
      };

      expect(document.meta.title).toBe("Test Title");
      expect(document.content).toBe("# Test Content");
      expect(document.mdx.code).toBe("compiled code");
    });
  });

  describe("ValidationResult", () => {
    it("represents valid result", () => {
      const result: ValidationResult = {
        isValid: true,
      };

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("represents invalid result with errors", () => {
      const result: ValidationResult = {
        isValid: false,
        errors: ["Missing title", "Invalid type"],
      };

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors?.[0]).toBe("Missing title");
      expect(result.errors?.[1]).toBe("Invalid type");
    });
  });
});
