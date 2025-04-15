import { test, expect, describe, beforeEach, afterEach, mock } from "bun:test";
import { ContentLoader, createContentLoader } from "../content-loader";
import { ContentCache, createContentCache } from "../content-cache";
import { DocumentNotFoundError, ContentLoadError } from "../errors";

// Store original fetch
const originalFetch = global.fetch;

describe("ContentLoader", () => {
  let cache: ContentCache;
  let loader: ContentLoader;
  let mockFetch: any;

  beforeEach(() => {
    // Create a new cache for each test
    cache = createContentCache();

    // Create a loader with the cache - explicitly set devMode
    loader = createContentLoader({ cache, devMode: true });

    // Mock the fetch function
    mockFetch = mock(() => {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve("default content"),
        json: () => Promise.resolve({ content: "default content from json" }),
        status: 200,
        statusText: "OK",
      });
    });

    global.fetch = mockFetch;
  });

  afterEach(() => {
    // Restore the original fetch
    global.fetch = originalFetch;
  });

  test("should create a loader with factory function", () => {
    const loader = createContentLoader();
    expect(loader).toBeInstanceOf(ContentLoader);
  });

  describe("Dev mode", () => {
    test("should load doc content in dev mode", async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve("doc content"),
          status: 200,
          statusText: "OK",
        });
      });

      const content = await loader.loadContent("/docs/mirascope/getting-started", "doc");

      expect(mockFetch).toHaveBeenCalled();
      expect(content).toBe("doc content");
    });

    test("should load blog content in dev mode", async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve("blog content"),
          status: 200,
          statusText: "OK",
        });
      });

      const content = await loader.loadContent("/blog/my-post", "blog");

      expect(mockFetch).toHaveBeenCalled();
      expect(content).toBe("blog content");
    });

    test("should load policy content in dev mode", async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve("policy content"),
          status: 200,
          statusText: "OK",
        });
      });

      const content = await loader.loadContent("/privacy", "policy");

      expect(mockFetch).toHaveBeenCalled();
      expect(content).toBe("policy content");
    });

    test("should throw DocumentNotFoundError for 404 responses", async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: "Not Found",
        });
      });

      try {
        await loader.loadContent("/docs/not-found", "doc");
        expect("should have thrown").toBe("but did not");
      } catch (error) {
        expect(error).toBeInstanceOf(DocumentNotFoundError);
      }
    });

    test("should wrap other errors in ContentLoadError", async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Server Error",
        });
      });

      try {
        await loader.loadContent("/docs/error", "doc");
        expect("should have thrown").toBe("but did not");
      } catch (error) {
        expect(error).toBeInstanceOf(ContentLoadError);
      }
    });
  });

  describe("Production mode", () => {
    beforeEach(() => {
      // Set dev mode to false for production tests
      loader = createContentLoader({ cache, devMode: false });
    });

    test("should load content from static files in production", async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ content: "static content" }),
          status: 200,
          statusText: "OK",
        });
      });

      const content = await loader.loadContent("/docs/mirascope/getting-started", "doc");

      expect(mockFetch).toHaveBeenCalled();
      expect(content).toBe("static content");
    });

    test("should throw DocumentNotFoundError for 404 responses", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: "Not Found",
        })
      );

      try {
        await loader.loadContent("/docs/not-found", "doc");
        expect("should have thrown").toBe("but did not");
      } catch (error) {
        expect(error).toBeInstanceOf(DocumentNotFoundError);
      }
    });

    test("should throw ContentLoadError for non-404 errors", async () => {
      mockFetch.mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Server Error",
        })
      );

      try {
        await loader.loadContent("/docs/error", "doc");
        expect("should have thrown").toBe("but did not");
      } catch (error) {
        expect(error).toBeInstanceOf(ContentLoadError);
      }
    });
  });

  describe("Caching", () => {
    test("should use cache when available", async () => {
      // Set something in the cache
      cache.set("doc", "mirascope/getting-started.mdx", "cached content");

      // Mock fetch to verify it's not called
      let fetchCallCount = 0;
      mockFetch.mockImplementation(() => {
        fetchCallCount++;
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve("fresh content"),
          status: 200,
        });
      });

      // Load content - should come from cache
      const content = await loader.loadContent("/docs/mirascope/getting-started", "doc");

      // Fetch should not be called when using cache
      expect(fetchCallCount).toBe(0);
      expect(content).toBe("cached content");
    });

    test("should update cache after fetching", async () => {
      // Mock fetch to track calls
      let fetchCallCount = 0;
      mockFetch.mockImplementation(() => {
        fetchCallCount++;
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve("fresh content"),
          status: 200,
        });
      });

      // First call - should fetch
      await loader.loadContent("/docs/mirascope/getting-started", "doc");
      expect(fetchCallCount).toBe(1);

      // Second call - should use cache
      await loader.loadContent("/docs/mirascope/getting-started", "doc");
      expect(fetchCallCount).toBe(1); // Still 1, not incremented
    });
  });
});
