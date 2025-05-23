import { test, expect } from "bun:test";
import { matchesRoutePattern, filterDocsByRoutes } from "./templates";
import type { DocInfo } from "./spec";

test("parseIncludeDirectives - basic parsing", () => {
  const content = `
Some content here
{{include routes=["mirascope/learn/*.mdx"]}}
More content
{{include routes=["lilypad/*"]}}
`;

  const directivePattern = /\{\{include\s+routes=(\[.*?\])\s*\}\}/g;
  const directives = [];
  let match;

  while ((match = directivePattern.exec(content)) !== null) {
    const routes = JSON.parse(match[1]);
    directives.push({ routes });
  }

  expect(directives).toHaveLength(2);
  expect(directives[0].routes).toEqual(["mirascope/learn/*.mdx"]);
  expect(directives[1].routes).toEqual(["lilypad/*"]);
});

test("parseIncludeDirectives - multiple routes", () => {
  const content = `{{include routes=["mirascope/index.mdx", "mirascope/learn/*.mdx", "lilypad/*"]}}`;

  const directivePattern = /\{\{include\s+routes=(\[.*?\])\s*\}\}/g;
  const directives = [];
  let match;

  while ((match = directivePattern.exec(content)) !== null) {
    const routes = JSON.parse(match[1]);
    directives.push({ routes });
  }

  expect(directives).toHaveLength(1);
  expect(directives[0].routes).toEqual([
    "mirascope/index.mdx",
    "mirascope/learn/*.mdx",
    "lilypad/*",
  ]);
});

test("matchesRoutePattern - exact match", () => {
  expect(matchesRoutePattern("mirascope/index", "mirascope/index")).toBe(true);
  expect(matchesRoutePattern("mirascope/index", "mirascope/learn")).toBe(false);
});

test("matchesRoutePattern - wildcard match", () => {
  expect(matchesRoutePattern("mirascope/learn/calls", "mirascope/learn/*")).toBe(true);
  expect(matchesRoutePattern("mirascope/learn/tools", "mirascope/learn/*")).toBe(true);
  expect(matchesRoutePattern("mirascope/api/core", "mirascope/learn/*")).toBe(false);
});

test("matchesRoutePattern - direct files only", () => {
  expect(matchesRoutePattern("mirascope/learn/calls", "mirascope/learn/*.mdx")).toBe(true);
  expect(matchesRoutePattern("mirascope/learn/extensions/custom", "mirascope/learn/*.mdx")).toBe(
    false
  );
  expect(matchesRoutePattern("mirascope/learn", "mirascope/learn/*.mdx")).toBe(false);
});

test("filterDocsByRoutes - maintains order", () => {
  const docs: DocInfo[] = [
    {
      path: "mirascope/index",
      routePath: "/docs/mirascope/",
      slug: "index",
      type: "docs",
      product: "mirascope",
      label: "Index",
      searchWeight: 1,
    },
    {
      path: "mirascope/learn/calls",
      routePath: "/docs/mirascope/learn/calls",
      slug: "calls",
      type: "docs",
      product: "mirascope",
      label: "Calls",
      searchWeight: 1,
    },
    {
      path: "mirascope/learn/tools",
      routePath: "/docs/mirascope/learn/tools",
      slug: "tools",
      type: "docs",
      product: "mirascope",
      label: "Tools",
      searchWeight: 1,
    },
    {
      path: "lilypad/index",
      routePath: "/docs/lilypad/",
      slug: "index",
      type: "docs",
      product: "lilypad",
      label: "Lilypad",
      searchWeight: 1,
    },
  ];

  const patterns = ["mirascope/index", "mirascope/learn/*"];
  const filtered = filterDocsByRoutes(docs, patterns);

  expect(filtered).toHaveLength(3);
  expect(filtered[0].path).toBe("mirascope/index");
  expect(filtered[1].path).toBe("mirascope/learn/calls");
  expect(filtered[2].path).toBe("mirascope/learn/tools");
});

test("filterDocsByRoutes - no duplicates", () => {
  const docs: DocInfo[] = [
    {
      path: "mirascope/learn/calls",
      routePath: "/docs/mirascope/learn/calls",
      slug: "calls",
      type: "docs",
      product: "mirascope",
      label: "Calls",
      searchWeight: 1,
    },
  ];

  const patterns = ["mirascope/learn/*", "mirascope/learn/*.mdx"];
  const filtered = filterDocsByRoutes(docs, patterns);

  expect(filtered).toHaveLength(1);
  expect(filtered[0].path).toBe("mirascope/learn/calls");
});
