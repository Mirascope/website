/**
 * Tests for static rendering utilities
 */

import { describe, test, expect } from "bun:test";
const { renderRouteToString } = await import("../static-renderer");

describe("Static Renderer", () => {
  // This test renders an actual route and verifies expected metadata
  test("renderRouteToString renders index route with correct metadata", async () => {
    // Import only when we need it to avoid side effects
    // Render the index route
    const result = await renderRouteToString("/");

    // Verify structure
    expect(result).toBeDefined();
    expect(result.html).toBeDefined();
    expect(result.metadata).toBeDefined();

    // Verify metadata contents
    expect(result.metadata.title).toBe("Home | Mirascope");
    expect(result.metadata.description).toBe("The AI Engineer's Developer Stack");

    // Verify meta tags include important SEO tags
    expect(result.metadata.meta).toContain("og:title");
    expect(result.metadata.meta).toContain("og:description");
    expect(result.metadata.meta).toContain("twitter:card");
  });

  test("renders home route with mirascope product attribute", async () => {
    // Render the index route
    const result = await renderRouteToString("/");

    // Verify the data-product attribute is set to "mirascope" on the root div
    expect(result.html).toContain('<div data-product="mirascope"');
  });

  test("renders pricing route with lilypad product attribute", async () => {
    // Render the pricing route
    const result = await renderRouteToString("/pricing");

    // Verify the data-product attribute is set to "lilypad" on the root div
    expect(result.html).toContain('<div data-product="lilypad"');
  });
});
