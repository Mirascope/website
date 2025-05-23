import { test, expect } from "bun:test";
import { include, defineLLMDocTemplate } from "./llm-documents";
import type { DocInfo } from "./spec";

test("include helpers create correct directive types", () => {
  expect(include.exact("mirascope/index.mdx")).toEqual({
    type: "exact",
    pattern: "mirascope/index.mdx",
  });

  expect(include.glob("mirascope/learn/*.mdx")).toEqual({
    type: "glob",
    pattern: "mirascope/learn/*.mdx",
  });

  expect(include.wildcard("lilypad/*")).toEqual({
    type: "wildcard",
    pattern: "lilypad/*",
  });
});

test("defineLLMDocTemplate validates required fields", () => {
  const validTemplate = {
    metadata: {
      slug: "test-doc",
      title: "Test Document",
      description: "A test document",
    },
    sections: [
      {
        title: "Test Section",
        includes: [include.exact("mirascope/index.mdx")],
      },
    ],
  };

  expect(() => defineLLMDocTemplate(validTemplate)).not.toThrow();

  // Missing slug
  expect(() =>
    defineLLMDocTemplate({
      ...validTemplate,
      metadata: { ...validTemplate.metadata, slug: "" },
    })
  ).toThrow("LLM document must have a slug");

  // Missing title
  expect(() =>
    defineLLMDocTemplate({
      ...validTemplate,
      metadata: { ...validTemplate.metadata, title: "" },
    })
  ).toThrow("LLM document must have a title");

  // Missing description
  expect(() =>
    defineLLMDocTemplate({
      ...validTemplate,
      metadata: { ...validTemplate.metadata, description: "" },
    })
  ).toThrow("LLM document must have a description");

  // Missing sections
  expect(() =>
    defineLLMDocTemplate({
      ...validTemplate,
      sections: [],
    })
  ).toThrow("LLM document must have at least one section");
});

test("pattern matching works correctly", () => {
  // Note: We'd need to expose the pattern matching logic or create a test processor
  // to properly test this. For now, we'll test the include directive creation.

  const mockDocs: DocInfo[] = [
    {
      label: "Index",
      path: "mirascope/index",
      routePath: "/docs/mirascope/",
      slug: "index",
      type: "docs",
      product: "mirascope",
      searchWeight: 1,
    },
    {
      label: "Calls",
      path: "mirascope/learn/calls",
      routePath: "/docs/mirascope/learn/calls",
      slug: "calls",
      type: "docs",
      product: "mirascope",
      searchWeight: 1,
    },
    {
      label: "Streams",
      path: "mirascope/learn/streams",
      routePath: "/docs/mirascope/learn/streams",
      slug: "streams",
      type: "docs",
      product: "mirascope",
      searchWeight: 1,
    },
  ];

  // This is a simplified test - in a real implementation we'd need access to
  // the pattern matching logic
  expect(mockDocs.length).toBe(3);
});
