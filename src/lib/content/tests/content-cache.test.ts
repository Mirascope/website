import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { ContentCache, createContentCache } from "../content-cache";
import type { ContentType } from "../content-types";

describe("ContentCache", () => {
  // Store original Date.now
  const originalDateNow = Date.now;

  // Mock for controlling time in tests
  let currentTime = 0;

  beforeEach(() => {
    // Mock the Date.now function to control time
    currentTime = 1000000;
    Date.now = () => currentTime;
  });

  afterEach(() => {
    // Restore the original Date.now
    Date.now = originalDateNow;
  });

  test("should create a cache using the factory function", () => {
    const cache = createContentCache();
    expect(cache).toBeInstanceOf(ContentCache);
  });

  test("should store and retrieve content", () => {
    const cache = createContentCache();
    const contentType: ContentType = "doc";
    const path = "test/path.mdx";
    const content = "Test content";

    cache.set(contentType, path, content);
    const retrieved = cache.get(contentType, path);

    expect(retrieved).toBe(content);
  });

  test("should return null for missing content", () => {
    const cache = createContentCache();
    const contentType: ContentType = "doc";
    const path = "test/path.mdx";

    const retrieved = cache.get(contentType, path);

    expect(retrieved).toBeNull();
  });

  test("should honor the disabled option", () => {
    const cache = createContentCache({ enabled: false });
    const contentType: ContentType = "doc";
    const path = "test/path.mdx";
    const content = "Test content";

    cache.set(contentType, path, content);
    const retrieved = cache.get(contentType, path);

    expect(retrieved).toBeNull();
  });

  test("should respect explicit expiration times", () => {
    const cache = createContentCache();
    const contentType: ContentType = "doc";
    const path = "test/path.mdx";
    const content = "Test content";
    const expiration = 1000; // 1 second

    // Set content with 1 second expiration
    cache.set(contentType, path, content, expiration);

    // Should be available immediately
    expect(cache.get(contentType, path)).toBe(content);

    // Advance time by 1.5 seconds
    currentTime += 1500;

    // Should now be expired
    expect(cache.get(contentType, path)).toBeNull();
  });

  test("should respect default expiration times", () => {
    const defaultExpiration = 2000; // 2 seconds
    const cache = createContentCache({ defaultExpiration });
    const contentType: ContentType = "doc";
    const path = "test/path.mdx";
    const content = "Test content";

    // Set content without explicit expiration
    cache.set(contentType, path, content);

    // Should be available immediately
    expect(cache.get(contentType, path)).toBe(content);

    // Advance time by 1 second (should still be valid)
    currentTime += 1000;
    expect(cache.get(contentType, path)).toBe(content);

    // Advance time by another 1.5 seconds (total 2.5 seconds)
    currentTime += 1500;

    // Should now be expired
    expect(cache.get(contentType, path)).toBeNull();
  });

  test("should evict least recently used entries when it exceeds max size", () => {
    const cache = createContentCache({ maxSize: 2 });
    const contentType: ContentType = "doc";

    // Add three entries to a cache with max size of 2
    cache.set(contentType, "path1", "content1");
    cache.set(contentType, "path2", "content2");

    // Check both entries exist
    expect(cache.get(contentType, "path1")).toBe("content1");
    expect(cache.get(contentType, "path2")).toBe("content2");

    // Access path1 to make it more recently used than path2
    cache.get(contentType, "path1");

    // Add a third entry, which should evict path2 (least recently used)
    cache.set(contentType, "path3", "content3");

    // path1 and path3 should exist, path2 should be evicted
    expect(cache.get(contentType, "path1")).toBe("content1");
    expect(cache.get(contentType, "path2")).toBeNull();
    expect(cache.get(contentType, "path3")).toBe("content3");
  });

  test("should invalidate specific cache entries with a pattern", () => {
    const cache = createContentCache();
    const docType: ContentType = "doc";
    const blogType: ContentType = "blog";

    cache.set(docType, "path1", "doc content 1");
    cache.set(docType, "path2", "doc content 2");
    cache.set(blogType, "path1", "blog content 1");

    // Invalidate all 'doc' entries
    cache.invalidate("^doc:");

    // Doc entries should be gone, blog entries should remain
    expect(cache.get(docType, "path1")).toBeNull();
    expect(cache.get(docType, "path2")).toBeNull();
    expect(cache.get(blogType, "path1")).toBe("blog content 1");
  });

  test("should invalidate all cache entries when no pattern is provided", () => {
    const cache = createContentCache();
    const docType: ContentType = "doc";
    const blogType: ContentType = "blog";

    cache.set(docType, "path1", "doc content 1");
    cache.set(blogType, "path1", "blog content 1");

    // Invalidate all entries
    cache.invalidate();

    // All entries should be gone
    expect(cache.get(docType, "path1")).toBeNull();
    expect(cache.get(blogType, "path1")).toBeNull();
  });

  test("should track and report stats correctly", () => {
    const cache = createContentCache();
    const contentType: ContentType = "doc";

    // Initial stats
    expect(cache.getStats()).toEqual({
      size: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
    });

    // Add an entry
    cache.set(contentType, "path1", "content1");

    // One hit
    cache.get(contentType, "path1");

    // Two misses
    cache.get(contentType, "missing1");
    cache.get(contentType, "missing2");

    // Stats should reflect the operations
    expect(cache.getStats()).toEqual({
      size: 1,
      hits: 1,
      misses: 2,
      hitRate: 1 / 3,
    });
  });
});
