import { describe, test, expect } from "bun:test";
import {
  getMetadataFromStructure,
  extractMetadataFromFrontmatter,
  mergeMetadata,
  validateMetadata,
} from "../metadata-service";
import type { DocMeta, BlogMeta, PolicyMeta } from "../content-types";
import { MetadataError, DocumentNotFoundError } from "../errors";

describe("getMetadataFromStructure", () => {
  test("returns documentation index metadata", () => {
    const meta = getMetadataFromStructure("/docs", "doc");
    expect(meta.title).toBe("Documentation");
    expect(meta.slug).toBe("index");
    expect(meta.path).toBe("index");
    expect(meta.type).toBe("doc");
  });

  test("returns product index metadata", () => {
    const meta = getMetadataFromStructure("/docs/mirascope", "doc") as DocMeta;
    expect(meta.title).toMatch(/Mirascope/); // The exact title might vary depending on the real data
    expect(meta.slug).toBe("mirascope");
    expect(meta.path).toBe("mirascope");
    expect(meta.product).toBe("mirascope");
    expect(meta.type).toBe("doc");
  });

  test("returns blog metadata from path", () => {
    const meta = getMetadataFromStructure("/blog/my-awesome-post", "blog") as BlogMeta;
    expect(meta.title).toBe("My awesome post");
    expect(meta.slug).toBe("my-awesome-post");
    expect(meta.path).toBe("blog/my-awesome-post");
    expect(meta.type).toBe("blog");
    expect(meta.author).toBe("Mirascope Team"); // Default author
  });

  test("returns policy metadata from path", () => {
    const meta = getMetadataFromStructure("/privacy", "policy");
    expect(meta.title).toBe("Privacy");
    expect(meta.slug).toBe("privacy");
    expect(meta.path).toBe("privacy");
    expect(meta.type).toBe("policy");
  });

  test("throws DocumentNotFoundError for unknown doc paths", () => {
    expect(() => {
      getMetadataFromStructure("/docs/unknown/path", "doc");
    }).toThrow(DocumentNotFoundError);
  });

  test("throws for unsupported content types", () => {
    expect(() => {
      // @ts-expect-error - testing invalid type
      getMetadataFromStructure("/test", "invalid");
    }).toThrow(MetadataError);
  });
});

describe("extractMetadataFromFrontmatter", () => {
  test("extracts doc metadata from frontmatter", () => {
    const frontmatter = {
      title: "Custom Title",
      description: "Custom description",
    };
    const meta = extractMetadataFromFrontmatter(frontmatter, "doc", "path");
    expect(meta.title).toBe("Custom Title");
    expect(meta.description).toBe("Custom description");
  });

  test("extracts blog metadata from frontmatter", () => {
    const frontmatter = {
      title: "Blog Post",
      description: "A blog post",
      date: "2023-01-01",
      readTime: "5 min",
      author: "John Doe",
      lastUpdated: "2023-02-01",
    };
    const meta = extractMetadataFromFrontmatter(frontmatter, "blog", "path") as Partial<BlogMeta>;
    expect(meta.title).toBe("Blog Post");
    expect(meta.description).toBe("A blog post");
    expect(meta.date).toBe("2023-01-01");
    expect(meta.readTime).toBe("5 min");
    expect(meta.author).toBe("John Doe");
    expect(meta.lastUpdated).toBe("2023-02-01");
  });

  test("extracts policy metadata from frontmatter", () => {
    const frontmatter = {
      title: "Privacy Policy",
      description: "Our privacy policy",
      lastUpdated: "2023-03-01",
    };
    const meta = extractMetadataFromFrontmatter(
      frontmatter,
      "policy",
      "path"
    ) as Partial<PolicyMeta>;
    expect(meta.title).toBe("Privacy Policy");
    expect(meta.description).toBe("Our privacy policy");
    expect(meta.lastUpdated).toBe("2023-03-01");
  });

  test("provides default values for missing blog fields", () => {
    const frontmatter = { title: "Blog Post" };
    const meta = extractMetadataFromFrontmatter(frontmatter, "blog", "path") as Partial<BlogMeta>;
    expect(meta.title).toBe("Blog Post");
    expect(meta.description).toBe("");
    expect(meta.date).toBe("");
    expect(meta.readTime).toBe("");
    expect(meta.author).toBe("Mirascope Team");
  });

  test("throws for unsupported content types", () => {
    expect(() => {
      // @ts-expect-error - testing invalid type
      extractMetadataFromFrontmatter({}, "invalid", "path");
    }).toThrow(MetadataError);
  });
});

describe("mergeMetadata", () => {
  test("merges frontmatter data into structure metadata for docs", () => {
    const structureMeta: DocMeta = {
      title: "Original Title",
      description: "",
      slug: "test",
      path: "mirascope/test",
      product: "mirascope",
      type: "doc",
    };

    const frontmatterMeta: Partial<DocMeta> = {
      title: "New Title",
      description: "New description",
    };

    const merged = mergeMetadata(structureMeta, frontmatterMeta);

    expect(merged.title).toBe("New Title");
    expect(merged.description).toBe("New description");
    expect(merged.slug).toBe("test"); // Unchanged
    expect(merged.path).toBe("mirascope/test"); // Unchanged
    expect(merged.product).toBe("mirascope"); // Unchanged
  });

  test("merges frontmatter data into structure metadata for blogs", () => {
    const structureMeta: BlogMeta = {
      title: "Original Title",
      description: "",
      slug: "test-post",
      path: "blog/test-post",
      type: "blog",
      date: "",
      author: "Mirascope Team",
      readTime: "",
    };

    const frontmatterMeta: Partial<BlogMeta> = {
      title: "New Title",
      description: "New description",
      date: "2023-04-01",
      readTime: "3 min",
      author: "Jane Doe",
      lastUpdated: "2023-05-01",
    };

    const merged = mergeMetadata(structureMeta, frontmatterMeta);

    expect(merged.title).toBe("New Title");
    expect(merged.description).toBe("New description");
    expect(merged.date).toBe("2023-04-01");
    expect(merged.readTime).toBe("3 min");
    expect(merged.author).toBe("Jane Doe");
    expect(merged.lastUpdated).toBe("2023-05-01");
    expect(merged.slug).toBe("test-post"); // Unchanged
    expect(merged.path).toBe("blog/test-post"); // Unchanged
  });

  test("only overwrites values that are provided", () => {
    const structureMeta: DocMeta = {
      title: "Original Title",
      description: "Original description",
      slug: "test",
      path: "mirascope/test",
      product: "mirascope",
      type: "doc",
    };

    const frontmatterMeta: Partial<DocMeta> = {
      title: "New Title",
      // No description
    };

    const merged = mergeMetadata(structureMeta, frontmatterMeta);

    expect(merged.title).toBe("New Title");
    expect(merged.description).toBe("Original description"); // Unchanged
  });

  test("ignores undefined or null values", () => {
    const structureMeta: DocMeta = {
      title: "Original Title",
      description: "Original description",
      slug: "test",
      path: "mirascope/test",
      product: "mirascope",
      type: "doc",
    };

    const frontmatterMeta: Partial<DocMeta> = {
      title: undefined,
      description: null as any,
    };

    const merged = mergeMetadata(structureMeta, frontmatterMeta);

    expect(merged.title).toBe("Original Title"); // Unchanged
    expect(merged.description).toBe("Original description"); // Unchanged
  });
});

describe("validateMetadata", () => {
  test("validates valid doc metadata", () => {
    const docMeta: DocMeta = {
      title: "Test Doc",
      description: "Test description",
      slug: "test",
      path: "mirascope/test",
      product: "mirascope",
      type: "doc",
    };

    const result = validateMetadata(docMeta, "doc");
    expect(result.isValid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test("validates valid blog metadata", () => {
    const blogMeta: BlogMeta = {
      title: "Test Blog",
      description: "Test description",
      slug: "test-blog",
      path: "blog/test-blog",
      type: "blog",
      date: "2023-01-01",
      author: "Test Author",
      readTime: "5 min",
    };

    const result = validateMetadata(blogMeta, "blog");
    expect(result.isValid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test("validates valid policy metadata", () => {
    const policyMeta: PolicyMeta = {
      title: "Test Policy",
      description: "Test description",
      slug: "test-policy",
      path: "policy/test-policy",
      type: "policy",
    };

    const result = validateMetadata(policyMeta, "policy");
    expect(result.isValid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test("returns validation errors for missing doc fields", () => {
    const docMeta = {
      description: "Test description",
      slug: "test",
      path: "mirascope/test",
      type: "doc",
    } as DocMeta;

    const result = validateMetadata(docMeta, "doc");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field: title");
  });

  test("returns validation errors for missing blog fields", () => {
    const blogMeta = {
      title: "Test Blog",
      description: "Test description",
      slug: "test-blog",
      path: "blog/test-blog",
      type: "blog",
      // Missing date, author, readTime
    } as BlogMeta;

    const result = validateMetadata(blogMeta, "blog");
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Missing required field for blog: date");
    expect(result.errors).toContain("Missing required field for blog: author");
    expect(result.errors).toContain("Missing required field for blog: readTime");
  });
});
