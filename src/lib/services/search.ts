import { environment } from "../content/environment";

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

    // Check if Pagefind is already loaded
    if (window.pagefind) {
      this.pagefind = window.pagefind;
      this.initialized = true;
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

      this.initialized = true;
    } catch (error) {
      this.initialized = false;
      if (environment.isDev()) {
        console.error("🔍 [SearchService] Error loading Pagefind:", error);
      }
      throw new Error("Search index not available. Run 'bun run build' to generate it.");
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

        const title = data.meta?.title || "Untitled";
        const excerpt = data.excerpt || "";
        const url = data.url || "";
        const section = data.meta?.section || getSectionFromUrl(data.url);

        // Create the result item with score included
        const resultItem = {
          title,
          excerpt,
          url,
          section,
          score: pagefindResult.score,
        };

        // Log detailed information for each result for debugging
        if (environment.isDev()) {
          console.log(`🔍 [SearchService] Result #${index} (score: ${pagefindResult.score})`, {
            score: pagefindResult.score,
            title,
            section,
            url,
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
