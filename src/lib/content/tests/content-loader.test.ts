import { test, expect, describe, beforeEach, afterEach, mock } from "bun:test";
import { loadContent, createContentLoader } from "../content-loader";
import { DocumentNotFoundError, ContentLoadError } from "../errors";

// Store original fetch
const originalFetch = global.fetch;

describe("ContentLoader", () => {
  let mockFetch: any;

  beforeEach(() => {
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
    expect(typeof loader.loadContent).toBe("function");
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

      const content = await loadContent("/docs/mirascope/getting-started", "doc", {
        devMode: true,
      });

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

      const content = await loadContent("/blog/my-post", "blog", { devMode: true });

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

      const content = await loadContent("/privacy", "policy", { devMode: true });

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
        await loadContent("/docs/not-found", "doc", { devMode: true });
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
        await loadContent("/docs/error", "doc", { devMode: true });
        expect("should have thrown").toBe("but did not");
      } catch (error) {
        expect(error).toBeInstanceOf(ContentLoadError);
      }
    });
  });

  describe("Production mode", () => {
    test("should load content from static files in production", async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ content: "static content" }),
          status: 200,
          statusText: "OK",
        });
      });

      const content = await loadContent("/docs/mirascope/getting-started", "doc", {
        devMode: false,
      });

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
        await loadContent("/docs/not-found", "doc", { devMode: false });
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
        await loadContent("/docs/error", "doc", { devMode: false });
        expect("should have thrown").toBe("but did not");
      } catch (error) {
        expect(error).toBeInstanceOf(ContentLoadError);
      }
    });
  });

  describe("Direct API", () => {
    test("should use provided custom fetch function", async () => {
      // Create a custom fetch function
      const customFetchFunction = mock(() => {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve("custom fetched content"),
          status: 200,
          statusText: "OK",
        });
      });

      // Use the mock function directly as customFetch with any type
      const customFetch = customFetchFunction as any;

      // Load content with the custom fetch function
      const content = await loadContent("/docs/mirascope/getting-started", "doc", {
        devMode: true,
        customFetch,
      });

      // The custom fetch should be called, not the global one
      expect(customFetch).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(content).toBe("custom fetched content");
    });

    test("factory function should pass options to loadContent", async () => {
      // Mock the fetch for this test
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve("content via factory"),
          status: 200,
          statusText: "OK",
        });
      });

      // Create loader with options
      const loader = createContentLoader({ devMode: true });

      // Use the loader
      const content = await loader.loadContent("/docs/mirascope/getting-started", "doc");

      // Validate that options were passed correctly
      expect(mockFetch).toHaveBeenCalled();
      expect(content).toBe("content via factory");
    });
  });
});
