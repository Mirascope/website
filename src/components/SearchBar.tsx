import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Search as SearchIcon, Command } from "lucide-react";
import { Link } from "@tanstack/react-router";

// Declare Pagefind types on the window object
declare global {
  interface Window {
    pagefind?: {
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
    meta?: Record<string, string>;
    content: string;
  }>;
}

// Simplified search result for our UI
interface SearchResultItem {
  title: string;
  excerpt: string;
  url: string;
  section: string;
  score?: number; // Add score from Pagefind
}

// Grouped search results
interface SearchResultGroup {
  name: string;
  results: SearchResultItem[];
}

// Component for an individual search result
interface SearchResultProps {
  result: SearchResultItem;
  onSelect: () => void;
}

function SearchResult({ result, onSelect }: SearchResultProps) {
  // Get development mode from environment
  const isDev = import.meta.env.DEV || import.meta.env.MODE === "development";

  return (
    <Link
      to={result.url}
      onClick={onSelect}
      className="flex px-4 py-3 hover:bg-accent/50 transition-colors text-sm border-t border-border/40 first:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-foreground truncate">{result.title || "Untitled"}</h4>
          <div className="flex items-center gap-2">
            {/* Section badge */}
            <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
              {result.section}
            </span>

            {/* Score indicator in development mode */}
            {isDev && result.score !== undefined && (
              <span className="text-[10px] text-muted-foreground">{result.score.toFixed(2)}</span>
            )}
          </div>
        </div>
        <p
          className="text-xs text-muted-foreground line-clamp-2 search-excerpt"
          dangerouslySetInnerHTML={{ __html: result.excerpt }}
        />
      </div>
    </Link>
  );
}

// Component for a group of search results
interface SearchResultGroupProps {
  group: SearchResultGroup;
  onResultSelect: () => void;
}

function SearchResultGroupComponent({ group, onResultSelect }: SearchResultGroupProps) {
  return (
    <div>
      {group.results.map((result, idx) => (
        <SearchResult key={`${result.url}-${idx}`} result={result} onSelect={onResultSelect} />
      ))}
    </div>
  );
}

// Component for the search input
interface SearchInputProps {
  query: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isOpen: boolean;
}

function SearchInput({ query, onChange, onFocus, inputRef, isOpen }: SearchInputProps) {
  return (
    <div
      className="relative flex items-center rounded-full border border-border bg-background/20 hover:bg-accent/30 transition-colors"
      onClick={onFocus}
    >
      <SearchIcon size={16} className="absolute left-3 text-muted-foreground" />
      <input
        ref={inputRef}
        readOnly={!isOpen}
        type="text"
        placeholder="Search..."
        className="flex h-9 w-40 lg:w-60 bg-transparent pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground cursor-pointer focus:cursor-text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-60">
        <span className="text-xs">⌘</span>K
      </kbd>
    </div>
  );
}

// Component for the search results container
interface SearchResultsContainerProps {
  isOpen: boolean;
  isLoading: boolean;
  isSearching: boolean;
  isPagefindLoaded: boolean;
  error: string;
  query: string;
  resultGroups: SearchResultGroup[];
  resultsRef: React.RefObject<HTMLDivElement | null>;
  onResultSelect: () => void;
}

function SearchResultsContainer({
  isOpen,
  isLoading,
  isSearching,
  isPagefindLoaded,
  error,
  query,
  resultGroups,
  resultsRef,
  onResultSelect,
}: SearchResultsContainerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="absolute top-full right-0 md:left-0 mt-2 w-screen max-w-sm bg-background border border-border rounded-lg shadow-2xl overflow-hidden z-50 search-results"
      ref={resultsRef}
    >
      {renderSearchContent()}
      <SearchFooter />
    </div>
  );

  function renderSearchContent() {
    if (isLoading && !isPagefindLoaded) {
      return <div className="p-6 text-center text-muted-foreground">Loading search engine...</div>;
    }

    if (isLoading || isSearching) {
      return (
        <div className="flex justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          <span className="sr-only">Loading results...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p className="mb-2">Search index not available</p>
          <p className="text-xs">
            Run <code className="bg-muted px-1 py-0.5 rounded">bun run build</code> to generate the
            search index
          </p>
        </div>
      );
    }

    if (resultGroups.length > 0) {
      return (
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          {resultGroups.map((group) => (
            <SearchResultGroupComponent
              key={group.name}
              group={group}
              onResultSelect={onResultSelect}
            />
          ))}
        </div>
      );
    }

    // Only show "No results" if we're not in a loading or searching state
    if (query.trim() && !isLoading && !isSearching) {
      return (
        <div className="p-4 text-center text-muted-foreground">No results found for "{query}"</div>
      );
    }

    return <div className="p-4 text-center text-muted-foreground">Type to start searching</div>;
  }
}

// Component for the keyboard shortcut footer
function SearchFooter() {
  return (
    <div className="border-t border-border p-2 flex justify-between items-center bg-muted/40 text-xs text-muted-foreground">
      <div className="flex items-center gap-2 px-2">
        <Command size={12} /> <kbd className="px-1.5 py-0.5 text-[10px] border rounded">K</kbd>
        <span>to search</span>
      </div>
      <div className="flex items-center gap-2 px-2">
        <kbd className="px-1.5 py-0.5 text-[10px] border rounded">Esc</kbd>
        <span>to close</span>
      </div>
    </div>
  );
}

export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [resultGroups, setResultGroups] = useState<SearchResultGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isPagefindLoaded, setIsPagefindLoaded] = useState(false);

  // Focus input when search is opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on escape key
      if (e.key === "Escape") {
        setIsOpen(false);
      }

      // Open on Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown as any);
    return () => window.removeEventListener("keydown", handleKeyDown as any);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
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

  // Perform search when query changes
  useEffect(() => {
    if (!query.trim() || !isPagefindLoaded) {
      setResultGroups([]);
      return;
    }

    // Set searching state immediately when query changes
    setIsSearching(true);

    // We'll use Pagefind's built-in debounced search instead of our own setTimeout
    const performSearch = async () => {
      try {
        if (!window.pagefind) return;

        // Get development mode from environment
        const isDev = import.meta.env.DEV || import.meta.env.MODE === "development";

        if (isDev) {
          console.log("🔍 [SearchBar] Performing search for:", query);
        }

        // Use the built-in debouncedSearch with 300ms delay
        const result = await window.pagefind.debouncedSearch(query, 300);

        // If the search was cancelled (due to rapid typing), don't process results
        if (result === null) {
          // Don't clear loading state here, as a new search will be initiated
          // Keep the spinner showing during rapid typing
          return;
        }

        if (isDev) {
          console.log(`🔍 [SearchBar] Found ${result.results.length} results, using top 20`);
        }

        // Process and transform results - only take the top 20
        const topResults = result.results.slice(0, 20);

        if (isDev) {
          console.log(
            `🔍 [SearchBar] Search query: "${query}" - Found ${result.results.length} results`
          );
        }

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
            if (isDev) {
              console.log(`🔍 [SearchBar] Result #${index} (score: ${pagefindResult.score})`, {
                score: pagefindResult.score,
                title,
                description: data.meta?.description || "No description",
                excerpt,
                url,
                meta: data.meta,
                content_preview: data.content.substring(0, 100) + "...",
              });
            }

            return resultItem;
          })
        );

        // Log table of results with titles for easier overview
        if (isDev) {
          console.table(
            items.map((item) => ({
              title: item.title,
              score: item.score,
              section: item.section,
            }))
          );
        }

        // Sort all results directly by score (highest first)
        const sortedItems = [...items].sort((a, b) => (b.score || 0) - (a.score || 0));

        // Create a single group with all results
        const sortedGroups = [
          {
            name: "Results",
            results: sortedItems,
          },
        ];

        // First update the results, then clear loading states to prevent flash of "No results"
        setResultGroups(sortedGroups);
        // Use small timeout to ensure state batching occurs properly
        setTimeout(() => {
          setIsLoading(false);
          setIsSearching(false);
        }, 10);
      } catch (error) {
        console.error("Search error:", error);
        setError("Failed to search");
        setResultGroups([]);
        setIsLoading(false);
        setIsSearching(false);
      }
    };

    setIsLoading(true);
    performSearch();

    return () => {
      // No need to clean up timers as Pagefind handles debouncing internally
    };
  }, [query, isPagefindLoaded]);

  // Handle result selection
  const handleResultSelect = () => {
    setIsOpen(false);
    setQuery("");
  };

  // Load Pagefind script
  const loadPagefind = async () => {
    try {
      setIsLoading(true);
      const isDev = import.meta.env.DEV || import.meta.env.MODE === "development";

      if (isDev) {
        console.log("🔍 [SearchBar] Attempting to load Pagefind...");
      }

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
        if (isDev) {
          console.error("🔍 [SearchBar] Error loading Pagefind:", error);
        }
        setError("Search index not available. Run 'bun run build' to generate it.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      if (import.meta.env.DEV) {
        console.error("🔍 [SearchBar] Error in loadPagefind:", error);
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract section from URL
  const getSectionFromUrl = (url?: string): string => {
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
    <div className="relative" ref={searchContainerRef}>
      <SearchInput
        query={query}
        onChange={setQuery}
        onFocus={() => setIsOpen(true)}
        inputRef={inputRef}
        isOpen={isOpen}
      />

      <SearchResultsContainer
        isOpen={isOpen}
        isLoading={isLoading}
        isSearching={isSearching}
        isPagefindLoaded={isPagefindLoaded}
        error={error}
        query={query}
        resultGroups={resultGroups}
        resultsRef={resultsRef}
        onResultSelect={handleResultSelect}
      />
    </div>
  );
}
