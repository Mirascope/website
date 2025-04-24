import { useState, useRef, useEffect } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

// Declare Pagefind types on the window object
declare global {
  interface Window {
    pagefind?: {
      init: () => Promise<void>;
      search: (query: string) => Promise<{
        results: PagefindResult[];
      }>;
      options: (options: any) => Promise<void>;
    };
  }
}

// Pagefind result interface based on actual API
interface PagefindResult {
  id: string;
  score: number;
  data: () => Promise<{
    url: string;
    excerpt: string;
    meta: Record<string, string>;
    content: string;
  }>;
}

// Simplified search result for our UI
interface SearchResultItem {
  title: string;
  excerpt: string;
  url: string;
  section: string;
}

// Grouped search results
interface SearchResultGroup {
  name: string;
  results: SearchResultItem[];
}

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [resultGroups, setResultGroups] = useState<SearchResultGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [isPagefindLoaded, setIsPagefindLoaded] = useState(false);

  // Focus input when search is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load Pagefind when the search is opened for the first time
  useEffect(() => {
    if (isOpen && !isPagefindLoaded && !window.pagefind) {
      loadPagefind();
    }
  }, [isOpen, isPagefindLoaded]);

  // Load Pagefind script
  const loadPagefind = async () => {
    try {
      setIsLoading(true);
      console.log("🔍 [SearchBar] Attempting to load Pagefind...");

      // Try to dynamically import Pagefind
      // Using a trick to bypass Vite's static analysis of import statements
      // We use the Function constructor to create a dynamic import that Vite won't analyze
      try {
        // This creates a function that will execute: return import("/_pagefind/pagefind.js")
        const dynamicImport = new Function("url", "return import(url)");
        const pagefind = await dynamicImport("/_pagefind/pagefind.js");

        // Assign the module to window.pagefind (it has methods directly on it, not as a default export)
        window.pagefind = pagefind;

        // Initialize Pagefind - required before using it
        await pagefind.init();

        // Configure Pagefind
        await pagefind.options({
          baseUrl: "/",
        });

        setIsPagefindLoaded(true);
      } catch (error) {
        console.error("🔍 [SearchBar] Error loading Pagefind:", error);
        setError("Search index not available. Run 'bun run build' to generate it.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      console.error("🔍 [SearchBar] Error in loadPagefind:", error);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Perform search with debounce
  useEffect(() => {
    if (!query.trim() || !isPagefindLoaded) {
      setResultGroups([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isPagefindLoaded]);

  const performSearch = async (searchQuery: string) => {
    if (!window.pagefind) return;

    setIsLoading(true);
    setError("");

    try {
      console.log("🔍 [SearchBar] Performing search for:", searchQuery);

      // Limit to 20 results to avoid overwhelming the UI
      const result = await window.pagefind.search(searchQuery);
      console.log(`🔍 [SearchBar] Found ${result.results.length} results, using top 20`);

      // Process and transform results - only take the top 20
      const topResults = result.results.slice(0, 20);
      const items: SearchResultItem[] = await Promise.all(
        topResults.map(async (result, index) => {
          const data = await result.data();

          if (index < 3) {
            // Only log a few examples to keep console clean
            console.log(`🔍 [SearchBar] Result ${index} data:`, {
              title: data.meta?.title,
              url: data.url,
              meta: data.meta,
            });
          }

          const title = data.meta?.title || "Untitled";
          const excerpt = data.excerpt || "";
          const url = data.url || "";
          const section = data.meta?.section || getSectionFromUrl(data.url);

          return {
            title,
            excerpt,
            url,
            section,
          };
        })
      );

      // Group results by section
      const groupedResults = items.reduce((groups, item) => {
        const sectionName = item.section;
        const existingGroup = groups.find((g) => g.name === sectionName);

        if (existingGroup) {
          existingGroup.results.push(item);
        } else {
          groups.push({
            name: sectionName,
            results: [item],
          });
        }

        return groups;
      }, [] as SearchResultGroup[]);

      // Sort groups and results within groups
      const sortedGroups = groupedResults
        .map((group) => ({
          ...group,
          results: group.results.sort((a, b) => a.title.localeCompare(b.title)),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      setResultGroups(sortedGroups);
    } catch (error) {
      console.error("Search error:", error);
      setError("Failed to search");
      setResultGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract section from URL
  const getSectionFromUrl = (url: string): string => {
    if (!url) return "Other";

    try {
      const path = new URL(url, window.location.origin).pathname;
      const segments = path.split("/").filter(Boolean);

      if (segments.length === 0) return "Home";

      // Format the section name
      const section = segments[0].charAt(0).toUpperCase() + segments[0].slice(1);
      return section;
    } catch (e) {
      return "Other";
    }
  };

  return (
    <div className="relative">
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md text-foreground hover:bg-accent transition-colors"
        aria-label="Search website"
      >
        <SearchIcon size={18} />
        <span className="hidden sm:inline">Search</span>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-16 px-4">
          <div
            className="w-full max-w-xl bg-background rounded-lg shadow-lg overflow-hidden"
            ref={resultsRef}
          >
            {/* Search Input */}
            <div className="flex items-center border-b border-border p-4">
              <SearchIcon size={20} className="text-muted-foreground mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for docs, blogs, guides..."
                className="flex-1 bg-transparent border-none outline-none text-foreground text-base"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[70vh] overflow-y-auto">
              {isLoading && !isPagefindLoaded ? (
                <div className="p-6 text-center text-muted-foreground">
                  Loading search engine...
                </div>
              ) : isLoading ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="p-6 text-center text-muted-foreground">
                  <p className="mb-2">Search index not available</p>
                  <p className="text-xs">
                    Run <code className="bg-muted px-1 py-0.5 rounded">bun run build</code> to
                    generate the search index
                  </p>
                </div>
              ) : resultGroups.length > 0 ? (
                <div className="py-2">
                  {resultGroups.map((group) => (
                    <div key={group.name} className="mb-4">
                      <h3 className="text-sm font-semibold text-muted-foreground px-4 py-2 uppercase tracking-wider">
                        {group.name}
                      </h3>
                      {group.results.map((result, idx) => (
                        <Link
                          key={`${result.url}-${idx}`}
                          to={result.url}
                          onClick={() => setIsOpen(false)}
                          className="block p-4 hover:bg-accent/50 transition-colors"
                        >
                          <h3 className="font-medium text-foreground mb-1">
                            {result.title || "Untitled"}
                          </h3>
                          <p
                            className="text-sm text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: result.excerpt }}
                          />
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-6 text-center text-muted-foreground">
                  No results found for "{query}"
                </div>
              ) : (
                <div className="p-6 text-center text-muted-foreground">Type to start searching</div>
              )}
            </div>

            <div className="border-t border-border p-4 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Press ESC to close</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
