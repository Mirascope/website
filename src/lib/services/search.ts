import { environment } from "../content/environment";
import { type ContentMeta } from "../content/content";

// Define Pagefind types
interface PagefindResult {
  id: string;
  score: number;
  data: () => Promise<{
    url: string;
    excerpt: string;
    meta?: Record<string, string>;
    content: string;
  }>;
}

interface PagefindAPI {
  init: () => Promise<void>;
  search: (query: string) => Promise<{
    results: PagefindResult[];
  }>;
  debouncedSearch: (
    query: string,
    time?: number
  ) => Promise<{
    results: PagefindResult[];
  } | null>;
  options: (options: any) => Promise<void>;
}

// Search result interfaces
export interface SearchResultItem {
  title: string;
  excerpt: string;
  url: string;
  section: string;
  score?: number;
  meta?: ContentMeta; // Optional content metadata if found
}

export interface SearchResponse {
  items: SearchResultItem[];
}

// Search service interface
export interface SearchService {
  init(): Promise<void>; // Will reject with an error if initialization fails
  search(query: string): Promise<SearchResponse | null>; // Will reject with an error if search fails
  isInitialized(): boolean;
}

// Helper function to extract section from URL
const getSectionFromUrl = (url?: string): string => {
  if (!url) return "Other";

  try {
    // Use server-side compatible URL parsing
    const path = url.startsWith("http") ? new URL(url).pathname : url;

    const segments = path.split("/").filter(Boolean);

    if (segments.length === 0) return "Home";

    // Format the section name
    const section = segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
    return section;
  } catch (e) {
    return "Other";
  }
};

// Implementation of the search service using Pagefind
export class PagefindSearchService implements SearchService {
  private pagefind: PagefindAPI | null = null;
  private initialized = false;
  private contentMeta: ContentMeta[] = [];
  private routeToMetaMap: Map<string, ContentMeta> = new Map();

  constructor() {}

  async init(): Promise<void> {
    if (this.initialized) return;

    if (environment.isDev()) {
      console.log("🔍 [SearchService] Initializing Pagefind...");
    }

    // Check if we're running in a browser environment
    if (typeof window === "undefined") {
      throw new Error("Cannot initialize search in a non-browser environment");
    }

    try {
      // We need to run two initialization tasks in parallel:
      // 1. Load Pagefind search engine
      // 2. Load the unified content metadata
      await Promise.all([this.initPagefind(), this.loadContentMeta()]);

      this.initialized = true;
    } catch (error) {
      this.initialized = false;
      if (environment.isDev()) {
        console.error("🔍 [SearchService] Error during initialization:", error);
      }
      throw new Error(
        "Search initialization failed. Try running 'bun run build' to regenerate content."
      );
    }
  }

  /**
   * Initialize the Pagefind search engine
   */
  private async initPagefind(): Promise<void> {
    // Check if Pagefind is already loaded
    if (window.pagefind) {
      this.pagefind = window.pagefind;
      return;
    }

    try {
      const dynamicImport = new Function("url", "return import(url)");
      const pagefind = await dynamicImport("/_pagefind/pagefind.js");

      // Store pagefind on the window and local instance
      window.pagefind = pagefind;
      this.pagefind = pagefind;

      // Initialize Pagefind
      await pagefind.init();

      // Configure Pagefind
      await pagefind.options({
        baseUrl: "/",
      });

      if (environment.isDev()) {
        console.log("🔍 [SearchService] Pagefind loaded successfully");
      }
    } catch (error) {
      if (environment.isDev()) {
        console.error("🔍 [SearchService] Error loading Pagefind:", error);
      }
      throw new Error("Search index not available. Run 'bun run build' to generate it.");
    }
  }

  /**
   * Load the unified content metadata and build route map
   */
  private async loadContentMeta(): Promise<void> {
    try {
      if (environment.isDev()) {
        console.log("🔍 [SearchService] Loading content metadata...");
      }

      // Fetch the unified metadata file
      const response = await fetch("/static/content-meta/unified.json");

      if (!response.ok) {
        throw new Error(
          `Failed to load content metadata: ${response.status} ${response.statusText}`
        );
      }

      // Parse the JSON response
      this.contentMeta = await response.json();

      // Build the route to metadata map for quick lookups
      this.routeToMetaMap = new Map();
      for (const meta of this.contentMeta) {
        this.routeToMetaMap.set(meta.route, meta);
      }

      if (environment.isDev()) {
        console.log(`🔍 [SearchService] Loaded ${this.contentMeta.length} content metadata items`);
      }
    } catch (error) {
      if (environment.isDev()) {
        console.error("🔍 [SearchService] Error loading content metadata:", error);
      }
      throw new Error(
        "Content metadata not available. Try running 'bun run build' to regenerate content."
      );
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async search(query: string): Promise<SearchResponse | null> {
    // Handle empty queries
    if (!query.trim()) {
      return { items: [] };
    }

    // Check initialization
    if (!this.initialized || !this.pagefind) {
      throw new Error("Search engine not initialized");
    }

    if (environment.isDev()) {
      console.log("🔍 [SearchService] Performing search for:", query);
    }

    // Use the built-in debouncedSearch with 300ms delay
    const result = await this.pagefind.debouncedSearch(query, 300);

    // If the search was cancelled (due to rapid typing), return null
    if (result === null) {
      if (environment.isDev()) {
        console.log("🔍 [SearchService] Search cancelled (returning null)");
      }
      return null;
    }

    if (environment.isDev()) {
      console.log(`🔍 [SearchService] Found ${result.results.length} results`);
    }

    // Process and transform results - only take the top 20
    const topResults = result.results.slice(0, 20);

    // Get all result data in a single batch of promises
    const items: SearchResultItem[] = await Promise.all(
      topResults.map(async (pagefindResult, index) => {
        const data = await pagefindResult.data();

        // Normalize the URL to match our routes
        const url = data.url || "";

        // Try to find matching metadata using the URL as route
        const meta = this.findMetadataByUrl(url);

        // Log warning for documents without metadata
        if (!meta) {
          console.warn(`🔍 [SearchService] No metadata found for URL: ${url}`);
        }

        // Use metadata if found, otherwise fallback to Pagefind data
        const title = meta?.title || data.meta?.title || "Untitled";
        const excerpt = data.excerpt || "";
        const section = meta
          ? this.getSectionFromMeta(meta)
          : data.meta?.section || getSectionFromUrl(url);

        // Create the result item with score included
        const resultItem = {
          title,
          excerpt,
          url,
          section,
          score: pagefindResult.score,
          meta: meta || undefined, // Include the full metadata if found
        };

        // Log detailed information for each result for debugging
        if (environment.isDev()) {
          console.log(`🔍 [SearchService] Result #${index} (score: ${pagefindResult.score})`, {
            score: pagefindResult.score,
            title,
            section,
            url,
            meta,
          });
        }

        return resultItem;
      })
    );

    // Apply custom reweighting logic
    const reweightedItems = this.applyCustomReweighting(items, query);

    // Return the search response with reweighted items
    return { items: reweightedItems };
  }

  /**
   * Finds the matching content metadata for a given URL
   * Handles URL normalization to match our route formats
   */
  private findMetadataByUrl(url: string): ContentMeta | undefined {
    // Normalize URL to handle potential differences
    let normalizedUrl = url;

    // Strip any domain part if present
    if (normalizedUrl.startsWith("http")) {
      try {
        normalizedUrl = new URL(normalizedUrl).pathname;
      } catch (e) {
        console.warn(`🔍 [SearchService] Failed to parse URL: ${url}`);
      }
    }

    // Ensure leading slash
    if (!normalizedUrl.startsWith("/")) {
      normalizedUrl = "/" + normalizedUrl;
    }

    // Remove trailing slash if present (except for root)
    if (normalizedUrl.endsWith("/") && normalizedUrl !== "/") {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }

    // Try to find metadata by route
    const meta = this.routeToMetaMap.get(normalizedUrl);

    // If not found, try alternative versions of the URL
    if (!meta) {
      // Try with trailing slash
      if (!normalizedUrl.endsWith("/")) {
        const withSlash = normalizedUrl + "/";
        const metaWithSlash = this.routeToMetaMap.get(withSlash);
        if (metaWithSlash) return metaWithSlash;
      }

      // Try without trailing slash
      if (normalizedUrl.endsWith("/")) {
        const withoutSlash = normalizedUrl.slice(0, -1);
        const metaWithoutSlash = this.routeToMetaMap.get(withoutSlash);
        if (metaWithoutSlash) return metaWithoutSlash;
      }
    }

    return meta;
  }

  /**
   * Extract section name from content metadata
   */
  private getSectionFromMeta(meta: ContentMeta): string {
    // For blog, doc, policy, and dev, we can derive section from the content type
    switch (meta.type) {
      case "blog":
        return "Blog";
      case "doc":
        // For docs, we can extract the product name for a more specific section
        const docPath = meta.path.split("/");
        if (docPath.length > 1) {
          const product = docPath[1];
          return product.charAt(0).toUpperCase() + product.slice(1);
        }
        return "Docs";
      case "policy":
        return "Policy";
      case "dev":
        return "Dev";
      default:
        return "Other";
    }
  }

  // Custom reweighting logic for search results - no-op for now
  private applyCustomReweighting(items: SearchResultItem[], _query: string): SearchResultItem[] {
    // Just sort by Pagefind score for now
    return [...items].sort((a, b) => (b.score || 0) - (a.score || 0));
  }
}

// Create singleton instance
let searchServiceInstance: SearchService | null = null;

// Factory function to get the search service
export function getSearchService(): SearchService {
  if (!searchServiceInstance) {
    searchServiceInstance = new PagefindSearchService();
  }
  return searchServiceInstance;
}

// Declare Pagefind types on the window object
declare global {
  interface Window {
    pagefind?: PagefindAPI;
  }
}
