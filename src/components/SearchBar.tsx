import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Search as SearchIcon, Command } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/src/lib/utils";

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
      className="hover:bg-accent/50 border-border/40 flex border-t px-4 py-3 text-sm transition-colors first:border-0"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <h4 className="text-foreground truncate font-medium">{result.title || "Untitled"}</h4>
          <div className="flex items-center gap-2">
            {/* Section badge */}
            <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px]">
              {result.section}
            </span>

            {/* Score indicator in development mode */}
            {isDev && result.score !== undefined && (
              <span className="text-muted-foreground text-[10px]">{result.score.toFixed(2)}</span>
            )}
          </div>
        </div>
        <p
          className="text-muted-foreground search-excerpt line-clamp-2 text-xs"
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
  isLandingPage?: boolean;
}

function SearchInput({
  query,
  onChange,
  onFocus,
  inputRef,
  isOpen,
  isLandingPage = false,
}: SearchInputProps) {
  return (
    <div
      className={cn(
        "h-9 rounded-full border transition-all duration-300",
        isLandingPage
          ? "border-white/30 bg-white/10 hover:bg-white/20"
          : "border-border bg-background/20 hover:bg-mirascope-purple/10 hover:border-mirascope-purple/80",
        isOpen ? "w-72 md:w-96" : "w-36" // Wider default size with text, much wider when expanded
      )}
      style={
        isLandingPage
          ? { boxShadow: "0 1px 5px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1)" }
          : undefined
      }
      onClick={onFocus}
    >
      <div className="relative flex h-full items-center">
        <SearchIcon
          size={16}
          className={cn(
            "absolute left-3 transition-all duration-300",
            isLandingPage ? "nav-icon-landing" : "nav-icon-regular"
          )}
        />
        <input
          ref={inputRef}
          readOnly={!isOpen}
          type="text"
          placeholder="Search..."
          className={cn(
            "h-full cursor-pointer bg-transparent text-sm transition-all duration-300 outline-none",
            isLandingPage
              ? "text-white placeholder:text-white/90"
              : "text-foreground placeholder:text-foreground",
            isOpen ? "w-full pr-9 pl-10 opacity-100" : "w-28 pr-3 pl-10 opacity-80"
          )}
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
        />
        {isOpen && (
          <kbd
            className={cn(
              "font-small absolute top-1/2 right-3 hidden h-5 -translate-y-1/2 items-center gap-1 rounded border px-1.5 font-mono text-[10px] opacity-80 lg:flex",
              isLandingPage
                ? "border-white/30 bg-white/10 text-white"
                : "border-border bg-muted text-foreground"
            )}
          >
            <span className="text-xs">⌘</span>K
          </kbd>
        )}
      </div>
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
  isLandingPage?: boolean;
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
  isLandingPage = false,
}: SearchResultsContainerProps) {
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "search-results absolute top-full right-0 z-50 mt-2 w-screen max-w-sm overflow-hidden rounded-lg shadow-2xl [text-shadow:none] md:left-0",
        "bg-background border-border border"
      )}
      style={
        isLandingPage
          ? { boxShadow: "0 1px 5px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1)" }
          : undefined
      }
      ref={resultsRef}
    >
      {renderSearchContent()}
      <SearchFooter />
    </div>
  );

  function renderSearchContent() {
    if (isLoading && !isPagefindLoaded) {
      return <div className="text-muted-foreground p-6 text-center">Loading search engine...</div>;
    }

    if (isLoading || isSearching) {
      return (
        <div className="flex justify-center p-4">
          <div className="border-primary h-6 w-6 animate-spin rounded-full border-t-2 border-b-2"></div>
          <span className="sr-only">Loading results...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-muted-foreground p-4 text-center">
          <p className="mb-2">Search index not available</p>
          <p className="text-xs">
            Run <code className="bg-muted rounded px-1 py-0.5">bun run build</code> to generate the
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
        <div className="text-muted-foreground p-4 text-center">No results found for "{query}"</div>
      );
    }

    return <div className="text-muted-foreground p-4 text-center">Type to start searching</div>;
  }
}

// Component for the keyboard shortcut footer
function SearchFooter() {
  return (
    <div className="border-border bg-muted/40 text-muted-foreground flex items-center justify-between border-t p-2 text-xs">
      <div className="flex items-center gap-2 px-2">
        <Command size={12} />
        <kbd className="border-border rounded border px-1.5 py-0.5 text-[10px]">K</kbd>
        <span>to search</span>
      </div>
      <div className="flex items-center gap-2 px-2">
        <kbd className="border-border rounded border px-1.5 py-0.5 text-[10px]">Esc</kbd>
        <span>to close</span>
      </div>
    </div>
  );
}

interface SearchBarProps {
  onOpenChange?: (isOpen: boolean) => void;
  isLandingPage?: boolean;
}

export default function SearchBar({ onOpenChange, isLandingPage = false }: SearchBarProps = {}) {
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

    // Use a slight delay to toggle visibility
    if (isOpen) {
      // Hide navigation immediately
      if (onOpenChange) onOpenChange(true);
    } else {
      // Show navigation after search closes with a delay for smooth transition
      const timer = setTimeout(() => {
        if (onOpenChange) onOpenChange(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onOpenChange]);

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
        isLandingPage={isLandingPage}
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
        isLandingPage={isLandingPage}
      />
    </div>
  );
}
