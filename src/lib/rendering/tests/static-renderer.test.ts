/**
 * Tests for static rendering utilities
 */

import { extractDescription, decodeHtmlEntities } from "../static-renderer";
import { describe, test, expect } from "bun:test";

describe("Static Renderer", () => {
  // Test HTML entity decoding
  test("decodes HTML entities correctly", () => {
    expect(decodeHtmlEntities("This &amp; that")).toBe("This & that");
    expect(decodeHtmlEntities("Quote &quot;text&quot;")).toBe('Quote "text"');
    expect(decodeHtmlEntities("Engineer&#x27;s Stack")).toBe("Engineer's Stack");
    expect(decodeHtmlEntities("Engineer&#39;s Stack")).toBe("Engineer's Stack");
    expect(decodeHtmlEntities("Less &lt; More &gt;")).toBe("Less < More >");
    expect(decodeHtmlEntities("Em dash &mdash; here")).toBe("Em dash — here");
    expect(decodeHtmlEntities("En dash &ndash; here")).toBe("En dash – here");
    // Test with no entities
    expect(decodeHtmlEntities("Plain text")).toBe("Plain text");
    // Test with unsupported entity (should remain unchanged)
    expect(decodeHtmlEntities("Unsupported &entity;")).toBe("Unsupported &entity;");
  });

  // Test the metadata extraction utility functions
  test("extracts description from meta tags", () => {
    // Test basic description extraction
    const metaString =
      '<meta name="description" content="Mirascope provides LLM abstractions that aren\'t obstructions." />';
    const description = extractDescription(metaString);
    expect(description).toBe("Mirascope provides LLM abstractions that aren't obstructions.");

    // Test og:description extraction
    const ogMetaString = '<meta property="og:description" content="Mirascope LLM abstractions" />';
    const ogDescription = extractDescription(ogMetaString);
    expect(ogDescription).toBe("Mirascope LLM abstractions");

    // Test twitter:description extraction
    const twitterMetaString = '<meta name="twitter:description" content="Twitter description" />';
    const twitterDescription = extractDescription(twitterMetaString);
    expect(twitterDescription).toBe("Twitter description");

    // Test with multiple meta tags (should extract the first match)
    const multipleMetaString = `
      <meta name="keywords" content="LLM, AI" />
      <meta name="description" content="Primary description" />
      <meta property="og:description" content="OG description" />
    `;
    const multipleDescription = extractDescription(multipleMetaString);
    expect(multipleDescription).toBe("Primary description");

    // Test with no description
    const noDescriptionMetaString = '<meta name="keywords" content="LLM, AI" />';
    const noDescription = extractDescription(noDescriptionMetaString);
    expect(noDescription).toBeNull();
  });

  // This test renders an actual route and verifies expected metadata
  test("renderRouteToString renders index route with correct metadata", async () => {
    // Import only when we need it to avoid side effects
    const { renderRouteToString } = await import("../static-renderer");

    // Render the index route
    const result = await renderRouteToString("/", false);

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
    const { renderRouteToString } = await import("../static-renderer");

    // Render the index route
    const result = await renderRouteToString("/", false);

    // Verify the data-product attribute is set to "mirascope" on the root div
    expect(result.html).toContain('<div data-product="mirascope"');
  });

  test("renders pricing route with lilypad product attribute", async () => {
    const { renderRouteToString } = await import("../static-renderer");

    // Render the pricing route
    const result = await renderRouteToString("/pricing", false);

    // Verify the data-product attribute is set to "lilypad" on the root div
    expect(result.html).toContain('<div data-product="lilypad"');
  });
});
