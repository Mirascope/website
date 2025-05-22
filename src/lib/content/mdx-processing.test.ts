import { describe, test, expect } from "bun:test";
import { parseFrontmatter, mergeFrontmatter, extractTableOfContents } from "./mdx-processing";

describe("Frontmatter Parser", () => {
  describe("parseFrontmatter", () => {
    test("extracts frontmatter and content using regex", () => {
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

    test("handles frontmatter with quoted values", () => {
      const input = `---
title: "Test Document with Quotes"
description: 'Single quoted description'
---

Content here.`;

      const result = parseFrontmatter(input);

      expect(result.frontmatter.title).toBe("Test Document with Quotes");
      expect(result.frontmatter.description).toBe("Single quoted description");
    });

    test("handles content without frontmatter", () => {
      const input = `# Just Content
      
No frontmatter here.`;

      const result = parseFrontmatter(input);

      expect(result.frontmatter).toEqual({});
      expect(result.content).toBe(input);
    });

    test("handles empty frontmatter", () => {
      const input = `---
---

Content after empty frontmatter.`;

      const result = parseFrontmatter(input);

      expect(result.frontmatter).toEqual({});
      expect(result.content.trim()).toBe("Content after empty frontmatter.");
    });

    test("handles frontmatter with empty lines", () => {
      const input = `---
title: Document with Empty Lines

description: Has a blank line in frontmatter
---

Content here.`;

      const result = parseFrontmatter(input);

      expect(result.frontmatter.title).toBe("Document with Empty Lines");
      expect(result.frontmatter.description).toBe("Has a blank line in frontmatter");
    });

    test("handles documents containing triple dashes in content", () => {
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

    test("handles malformed frontmatter gracefully", () => {
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

  describe("mergeFrontmatter", () => {
    test("merges two frontmatter objects without overwriting", () => {
      const target = { title: "Original Title", description: "Original Description" };
      const source = { title: "New Title", author: "Test Author" };

      const result = mergeFrontmatter(target, source);

      expect(result.title).toBe("Original Title"); // Not overwritten
      expect(result.description).toBe("Original Description"); // Kept
      expect(result.author).toBe("Test Author"); // Added
    });

    test("merges with overwrite when specified", () => {
      const target = { title: "Original Title", description: "Original Description" };
      const source = { title: "New Title", author: "Test Author" };

      const result = mergeFrontmatter(target, source, true);

      expect(result.title).toBe("New Title"); // Overwritten
      expect(result.description).toBe("Original Description"); // Kept
      expect(result.author).toBe("Test Author"); // Added
    });

    test("handles empty source", () => {
      const target = { title: "Original Title" };
      const source = {};

      const result = mergeFrontmatter(target, source);

      expect(result).toEqual(target);
    });

    test("handles empty target", () => {
      const target = {};
      const source = { title: "New Title" };

      const result = mergeFrontmatter(target, source);

      expect(result).toEqual(source);
    });
  });
});

describe("Table of Contents Extraction", () => {
  describe("extractTableOfContents", () => {
    test("extracts headings with correct levels", () => {
      const content = `
# Heading 1
Content here
## Heading 2
More content
### Heading 3
Even more content
`;

      const toc = extractTableOfContents(content);

      expect(toc).toHaveLength(3);
      expect(toc[0]).toEqual({
        id: "heading-1",
        text: "Heading 1",
        level: 1,
      });
      expect(toc[1]).toEqual({
        id: "heading-2",
        text: "Heading 2",
        level: 2,
      });
      expect(toc[2]).toEqual({
        id: "heading-3",
        text: "Heading 3",
        level: 3,
      });
    });

    test("handles headings with explicit IDs", () => {
      const content = `
# Introduction {#intro}
## Getting Started {#getting-started}
## Advanced Usage {#advanced}
`;

      const toc = extractTableOfContents(content);

      expect(toc).toHaveLength(3);
      expect(toc[0].id).toBe("intro");
      expect(toc[1].id).toBe("getting-started");
      expect(toc[2].id).toBe("advanced");
    });

    test("generates proper IDs from heading text", () => {
      const content = `
# Special Characters: @#$%^&*()!
## Multiple   Spaces Here
### Uppercase HEADINGS
`;

      const toc = extractTableOfContents(content);

      expect(toc).toHaveLength(3);
      expect(toc[0].id).toBe("special-characters");
      expect(toc[1].id).toBe("multiple-spaces-here");
      expect(toc[2].id).toBe("uppercase-headings");
    });

    test("handles headings with mixed content", () => {
      const content = `
Here is some text.

# First Heading
Content after first heading.

Some more text...

## Second Heading

More content...

This is not a heading.
### This is a heading
`;

      const toc = extractTableOfContents(content);

      expect(toc).toHaveLength(3);
      expect(toc[0].text).toBe("First Heading");
      expect(toc[1].text).toBe("Second Heading");
      expect(toc[2].text).toBe("This is a heading");
    });

    test("returns empty array for content with no headings", () => {
      const content = `
This is a document with no headings.

Just paragraphs of text.

No heading structures at all.
      `;

      const toc = extractTableOfContents(content);

      expect(toc).toHaveLength(0);
    });

    test("handles non-english characters in headings", () => {
      const content = `
# 你好世界
## Über die Anwendung
### حالة المشروع
`;

      const toc = extractTableOfContents(content);

      expect(toc).toHaveLength(3);
      expect(toc[0].text).toBe("你好世界");
      expect(toc[1].text).toBe("Über die Anwendung");
      expect(toc[2].text).toBe("حالة المشروع");

      // IDs should be normalized
      expect(toc[0].id).not.toContain("你好世界");
      expect(toc[1].id).not.toContain("Über");
      expect(toc[2].id).not.toContain("حالة");
    });

    test("handles code content", () => {
      const content = `
\`\`\`
# This is a comment, not a Heading.
\`\`\`
`;

      const toc = extractTableOfContents(content);

      expect(toc).toHaveLength(0);
    });

    test("handles component content", () => {
      const content = `
<CustomComponent>
# By virtue of being nested inside a custom component, this is not a heading.
</CustomComponent>

`;

      const toc = extractTableOfContents(content);

      expect(toc).toHaveLength(0);
    });

    test("handles nested components", () => {
      const content = `

# First Heading
<CustomComponent>
# By virtue of being nested inside a custom component, this is not a heading.
  <SubComponent>
  # This is still not a heading.
  </SubComponent>
</CustomComponent>

<InlineComponent />

# Second Heading
`;

      const toc = extractTableOfContents(content);

      expect(toc).toHaveLength(2);
      expect(toc[0].text).toBe("First Heading");
      expect(toc[1].text).toBe("Second Heading");
    });

    test("handles realistic case", () => {
      const content = `
# Mirascope 

## Getting Started

Install Mirascope, specifying the provider you intend to use, and set your API key:

<InstallSnippet className="mt-4" />

## Mirascope API

Mirascope provides a consistent, easy-to-use API across all providers:

## Provider SDK Equivalent

For comparison, here's how you would achieve the same result using the provider's native SDK:

<Info title="Official SDK" collapsible={true}>
</Info>
`;

      const toc = extractTableOfContents(content);

      expect(toc).toHaveLength(4);
    });

    test("processes APIType correctly", () => {
      const content = `
# mirascope.llm.call

## <ApiType type="Alias" path="llm/call" symbolName="call" /> call

A decorator for making provider-agnostic LLM API calls with a typed function.

<Info title="Usage">

# Not a heading

[Calls](/docs/mirascope/learn/calls)

</Info>
`;

      const toc = extractTableOfContents(content);

      expect(toc).toHaveLength(2);
      expect(toc[0].text).toBe("mirascope.llm.call");
      expect(toc[1].text).toBe("[Alias] call");
    });
  });
});
