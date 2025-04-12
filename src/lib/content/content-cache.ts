import type { ContentType } from "./content-types";

/**
 * Options for configuring a content cache
 */
export interface CacheOptions {
  maxSize?: number;
  defaultExpiration?: number;
  enabled?: boolean;
}

/**
 * A cached content entry
 */
export interface CacheEntry {
  content: string;
  timestamp: number;
  expires?: number;
}

/**
 * Statistics about cache performance
 */
export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

/**
 * Default cache options
 */
const DEFAULT_OPTIONS: Required<CacheOptions> = {
  maxSize: 100,
  defaultExpiration: isDev() ? 5 * 60 * 1000 : 0, // 5 minutes in dev, no expiration in prod
  enabled: true,
};

/**
 * Simple helper to check if running in development mode
 */
function isDev(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Content cache for storing and retrieving document content
 */
export class ContentCache {
  private cache = new Map<string, CacheEntry>();
  private options: Required<CacheOptions>;
  private hits = 0;
  private misses = 0;
  private lruOrder: string[] = [];

  constructor(options?: CacheOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Builds a cache key from a content type and path
   */
  private buildKey(contentType: ContentType, path: string): string {
    return `${contentType}:${path}`;
  }

  /**
   * Retrieves content from the cache
   */
  get(contentType: ContentType, path: string): string | null {
    if (!this.options.enabled) {
      this.misses++;
      return null;
    }

    const key = this.buildKey(contentType, path);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if the entry has expired
    if (entry.expires && Date.now() > entry.expires) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update LRU order
    this.updateLruOrder(key);
    this.hits++;
    return entry.content;
  }

  /**
   * Stores content in the cache
   */
  set(contentType: ContentType, path: string, content: string, expiration?: number): void {
    if (!this.options.enabled) {
      return;
    }

    const key = this.buildKey(contentType, path);
    const entry: CacheEntry = {
      content,
      timestamp: Date.now(),
    };

    // Set expiration if provided or use default
    if (expiration || this.options.defaultExpiration) {
      entry.expires = Date.now() + (expiration || this.options.defaultExpiration);
    }

    // Check if we need to evict an entry to make room
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }

    // Store the entry and update LRU order
    this.cache.set(key, entry);
    this.updateLruOrder(key);
  }

  /**
   * Updates the LRU order by moving the accessed key to the end of the array
   */
  private updateLruOrder(key: string): void {
    const index = this.lruOrder.indexOf(key);
    if (index > -1) {
      this.lruOrder.splice(index, 1);
    }
    this.lruOrder.push(key);
  }

  /**
   * Evicts the least recently used entry from the cache
   */
  private evictLeastRecentlyUsed(): void {
    if (this.lruOrder.length > 0) {
      const key = this.lruOrder.shift();
      if (key) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidates cache entries matching a pattern
   */
  invalidate(pattern?: string | RegExp): void {
    if (!pattern) {
      // Clear the entire cache
      this.cache.clear();
      this.lruOrder = [];
      return;
    }

    // Convert string pattern to RegExp if needed
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);

    // Remove matching entries from the cache and LRU order
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        const index = this.lruOrder.indexOf(key);
        if (index > -1) {
          this.lruOrder.splice(index, 1);
        }
      }
    }
  }

  /**
   * Returns statistics about the cache
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: totalRequests > 0 ? this.hits / totalRequests : 0,
    };
  }
}

/**
 * Factory function to create a content cache with the specified options
 */
export function createContentCache(options?: CacheOptions): ContentCache {
  return new ContentCache(options);
}
