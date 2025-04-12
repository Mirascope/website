import { describe, it, expect } from "vitest";
import { parseFrontmatter, validateFrontmatter, mergeFrontmatter } from "../frontmatter";
import type { ContentType } from "../content-types";

describe("Frontmatter Parser", () => {
  describe("parseFrontmatter", () => {
    it("extracts frontmatter and content using regex", () => {
      const input = `---
title: Test Document
description: This is a test
author: Test Author
---

# Test Document

This is the content.`;

      const result = parseFrontmatter(input);

      expect(result.frontmatter).toEqual({
        title: "Test Document",
        description: "This is a test",
        author: "Test Author",
      });
      expect(result.content.trim()).toBe("# Test Document\n\nThis is the content.");
    });

    it("handles frontmatter with quoted values", () => {
      const input = `---
title: "Test Document with Quotes"
description: 'Single quoted description'
---

Content here.`;

      const result = parseFrontmatter(input);

      expect(result.frontmatter.title).toBe("Test Document with Quotes");
      expect(result.frontmatter.description).toBe("Single quoted description");
    });

    it("handles content without frontmatter", () => {
      const input = `# Just Content
      
No frontmatter here.`;

      const result = parseFrontmatter(input);

      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe(input);
    });

    it("handles empty frontmatter", () => {
      const input = `---
---

Content after empty frontmatter.`;

      const result = parseFrontmatter(input);

      expect(result.frontmatter).toEqual({});
      expect(result.content.trim()).toBe("Content after empty frontmatter.");
    });

    it("handles frontmatter with empty lines", () => {
      const input = `---
title: Document with Empty Lines

description: Has a blank line in frontmatter
---

Content here.`;

      const result = parseFrontmatter(input);

      expect(result.frontmatter.title).toBe("Document with Empty Lines");
      expect(result.frontmatter.description).toBe("Has a blank line in frontmatter");
    });

    it("handles documents containing triple dashes in content", () => {
      const input = `---
title: Document with Dashes
---

Content with --- dashes in the middle should be preserved.

---
This should be part of the content too.`;

      const result = parseFrontmatter(input);

      expect(result.frontmatter.title).toBe("Document with Dashes");
      expect(result.content).toContain("Content with --- dashes");
      expect(result.content).toContain("This should be part of the content too.");
    });

    it("handles malformed frontmatter gracefully", () => {
      const input = `---
This is not proper frontmatter
No colons here
---

Content after malformed frontmatter.`;

      const result = parseFrontmatter(input);

      expect(result.frontmatter).toEqual({});
      expect(result.content.trim()).toBe("Content after malformed frontmatter.");
    });
  });

  describe("validateFrontmatter", () => {
    it("validates common required fields", () => {
      const frontmatter = {};
      const result = validateFrontmatter(frontmatter, "doc" as ContentType);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Missing required field: title");
    });

    it("passes validation when all required fields are present", () => {
      const frontmatter = { title: "Test Document" };
      const result = validateFrontmatter(frontmatter, "doc" as ContentType);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it("validates blog-specific required fields", () => {
      const frontmatter = { title: "Test Blog" };
      const result = validateFrontmatter(frontmatter, "blog" as ContentType);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Missing required field: date");
      expect(result.errors).toContain("Missing required field: author");
    });

    it("passes blog validation when all required fields are present", () => {
      const frontmatter = {
        title: "Test Blog",
        date: "2023-01-01",
        author: "Test Author",
      };
      const result = validateFrontmatter(frontmatter, "blog" as ContentType);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });

  describe("mergeFrontmatter", () => {
    it("merges two frontmatter objects without overwriting", () => {
      const target = { title: "Original Title", description: "Original Description" };
      const source = { title: "New Title", author: "Test Author" };

      const result = mergeFrontmatter(target, source);

      expect(result.title).toBe("Original Title"); // Not overwritten
      expect(result.description).toBe("Original Description"); // Kept
      expect(result.author).toBe("Test Author"); // Added
    });

    it("merges with overwrite when specified", () => {
      const target = { title: "Original Title", description: "Original Description" };
      const source = { title: "New Title", author: "Test Author" };

      const result = mergeFrontmatter(target, source, true);

      expect(result.title).toBe("New Title"); // Overwritten
      expect(result.description).toBe("Original Description"); // Kept
      expect(result.author).toBe("Test Author"); // Added
    });

    it("handles empty source", () => {
      const target = { title: "Original Title" };
      const source = {};

      const result = mergeFrontmatter(target, source);

      expect(result).toEqual(target);
    });

    it("handles empty target", () => {
      const target = {};
      const source = { title: "New Title" };

      const result = mergeFrontmatter(target, source);

      expect(result).toEqual(source);
    });
  });
});
