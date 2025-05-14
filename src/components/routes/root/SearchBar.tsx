import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/src/lib/utils";
import { getSearchService, type SearchResultItem } from "@/src/lib/services/search";
import { environment } from "@/src/lib/content/environment";
import { useIsLandingPage } from "@/src/components/core";

// Component for an individual search result
interface SearchResultProps {
  result: SearchResultItem;
  onSelect: () => void;
  isSelected?: boolean;
  index: number;
  onHover: (index: number) => void;
}

function SearchResult({ result, onSelect, isSelected = false, index, onHover }: SearchResultProps) {
  // Get development mode from environment
  const isDev = environment.isDev();

  // Get description and excerpt separately
  const description = result.meta?.description;
  const excerpt = result.excerpt;

  return (
    <Link
      to={result.url}
      onClick={onSelect}
      onMouseEnter={() => onHover(index)}
      onMouseMove={() => onHover(index)}
      className={cn(
        "border-border/40 flex border-t px-5 py-4 text-sm transition-colors first:border-0",
        isSelected ? "bg-accent/50" : ""
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-foreground truncate text-base font-medium">
            {result.title || "Untitled"}
          </h4>
          <div className="flex items-center gap-2">
            {/* Section badge */}
            <span className="bg-muted text-muted-foreground max-w-[150px] truncate rounded px-1.5 py-0.5 text-[10px]">
              {result.section}
            </span>

            {/* Score indicator in development mode */}
            {isDev && result.score !== undefined && (
              <span className="text-muted-foreground text-[10px]">{result.score.toFixed(2)}</span>
            )}
          </div>
        </div>

        {/* Description - shown if available */}
        {description && (
          <p className="text-muted-foreground search-description mb-1.5 line-clamp-2 text-sm">
            {description}
          </p>
        )}

        {/* Excerpt - always shown, italicized */}
        <p
          className="text-muted-foreground search-excerpt line-clamp-2 text-xs italic"
          dangerouslySetInnerHTML={{ __html: excerpt }}
        />
      </div>
    </Link>
  );
}

// Maximum number of search results to display
const MAX_DISPLAYED_RESULTS = 20;

// Component for a list of search results
interface SearchResultListProps {
  results: SearchResultItem[];
  onResultSelect: () => void;
  selectedIndex: number;
  onHover: (index: number) => void;
}

function SearchResultList({
  results,
  onResultSelect,
  selectedIndex,
  onHover,
}: SearchResultListProps) {
  // Only display up to MAX_DISPLAYED_RESULTS
  const displayedResults = results.slice(0, MAX_DISPLAYED_RESULTS);

  return (
    <div>
      {displayedResults.map((result, idx) => (
        <SearchResult
          key={`${result.url}-${idx}`}
          result={result}
          onSelect={onResultSelect}
          isSelected={idx === selectedIndex}
          index={idx}
          onHover={onHover}
        />
      ))}
      {results.length > MAX_DISPLAYED_RESULTS && (
        <div className="text-muted-foreground border-border/40 border-t px-4 py-2 text-center text-xs">
          Showing top {MAX_DISPLAYED_RESULTS} of {results.length} results
        </div>
      )}
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
  const isLandingPage = useIsLandingPage();
  return (
    <div
      className={cn(
        "h-9 rounded-full transition-all duration-500",
        isLandingPage
          ? "border-0 bg-white/10 hover:bg-white/20"
          : "border-border bg-background/20 hover:bg-primary/10 hover:border-primary/80 border",
        isOpen
          ? "w-80 md:w-[32rem]" // Wider when expanded
          : "w-9 lg:w-36" // Icon-only on small screens, wider on lg screens
      )}
      style={
        isLandingPage
          ? { boxShadow: "0 1px 5px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1)" }
          : undefined
      }
      onClick={onFocus}
    >
      <div className="relative flex h-full items-center overflow-visible">
        <SearchIcon
          size={16}
          className={cn(
            "transition-all duration-500",
            isLandingPage ? "nav-icon-landing" : "nav-icon-regular",
            isOpen ? "absolute left-3" : "mx-auto lg:absolute lg:left-3" // Center icon when collapsed on small screens
          )}
        />
        <input
          ref={inputRef}
          readOnly={!isOpen}
          type="text"
          placeholder="Search..."
          className={cn(
            "cursor-pointer overflow-visible bg-transparent py-0 text-sm leading-normal transition-all duration-500 outline-none",
            isLandingPage
              ? "text-white placeholder:text-white/90"
              : "text-foreground placeholder:text-foreground",
            isOpen
              ? "w-full pr-9 pl-10 opacity-100" // Full width when open
              : "w-0 opacity-0 lg:w-28 lg:pr-3 lg:pl-10 lg:opacity-80" // Hide text on small screens, show on lg
          )}
          style={{ height: "auto", minHeight: "100%" }}
          value={query}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
        />
        {isOpen && (
          <kbd
            className={cn(
              "font-small absolute top-1/2 right-3 hidden h-5 -translate-y-1/2 items-center gap-1 rounded border px-1.5 font-mono text-[10px] opacity-80 lg:flex",
              isLandingPage ? "bg-white/10 text-white" : "border-border bg-muted text-foreground"
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
  results: SearchResultItem[];
  resultsRef: React.RefObject<HTMLDivElement | null>;
  onResultSelect: () => void;
  isLandingPage?: boolean;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
}

function SearchResultsContainer({
  isOpen,
  isLoading,
  isSearching,
  isPagefindLoaded,
  error,
  query,
  results,
  resultsRef,
  onResultSelect,
  isLandingPage = false,
  selectedIndex,
  setSelectedIndex,
}: SearchResultsContainerProps) {
  // Use a fixed state derived from isOpen with some delayed rendering logic
  const [isReallyVisible, setIsReallyVisible] = useState(false);

  // When isOpen changes, update visibility with a delay for animation
  useEffect(() => {
    if (isOpen) {
      // Slight delay to allow search bar to expand first
      const timer = setTimeout(() => setIsReallyVisible(true), 150);
      return () => clearTimeout(timer);
    } else {
      setIsReallyVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "search-results absolute top-full z-50 mt-2 w-screen max-w-[32rem] overflow-hidden rounded-lg shadow-2xl [text-shadow:none]",
        "bg-background border-border border transition-opacity duration-300",
        "right-0 lg:right-auto lg:left-0", // Position from right on small screens, from left on large screens
        isLandingPage ? "textured-bg-absolute" : ""
      )}
      style={{
        opacity: isReallyVisible ? 1 : 0,
        ...(isLandingPage
          ? { boxShadow: "0 1px 5px rgba(0, 0, 0, 0.15), 0 2px 10px rgba(0, 0, 0, 0.1)" }
          : {}),
      }}
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

    // Check if we have any results to show
    const hasResults = results.length > 0;

    if (hasResults) {
      return (
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
          <SearchResultList
            results={results}
            onResultSelect={onResultSelect}
            selectedIndex={selectedIndex}
            onHover={setSelectedIndex}
          />
        </div>
      );
    }

    // Only show "No results" if we're not in a loading or searching state
    // and there's actually no results to show
    if (query.trim() && !isLoading && !isSearching && !hasResults) {
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
        <kbd className="border-border rounded border px-1.5 py-0.5 text-[12px]">
          <span className="pr-1 text-xs">⌘</span>
          <span>K</span>
        </kbd>
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
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isPagefindLoaded, setIsPagefindLoaded] = useState(false);

  // Get the search service
  const searchService = getSearchService();

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
      }, 500);
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

      // Only handle arrow keys when search is open and we have results
      if (isOpen && results.length > 0) {
        // Navigate down with down arrow
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prevIndex) =>
            prevIndex < Math.min(results.length - 1, MAX_DISPLAYED_RESULTS - 1)
              ? prevIndex + 1
              : prevIndex
          );
        }

        // Navigate up with up arrow
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex));
        }

        // Select item with Enter key
        if (e.key === "Enter" && selectedIndex >= 0 && selectedIndex < results.length) {
          e.preventDefault();
          // Let the result selection be handled by the Link component
          // by programmatically clicking the selected result item
          const resultElements = resultsRef.current?.querySelectorAll("a");
          if (resultElements && resultElements[selectedIndex]) {
            resultElements[selectedIndex].click();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown as any);
    return () => window.removeEventListener("keydown", handleKeyDown as any);
  }, [isOpen, results, selectedIndex]);

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

  // Initialize search service when the search is opened for the first time
  useEffect(() => {
    if (isOpen && !isPagefindLoaded) {
      initializeSearch();
    }
  }, [isOpen, isPagefindLoaded]);

  // Perform search when query changes
  useEffect(() => {
    if (!query.trim() || !isPagefindLoaded) {
      setResults([]);
      return;
    }

    // Set searching state immediately when query changes
    setIsSearching(true);
    setIsLoading(true);

    const performSearch = async () => {
      try {
        // Use the search service to perform the search
        const response = await searchService.search(query);

        // If null, a new search will be started soon, so maintain loading state
        if (response === null) {
          return;
        }

        // Update state with the results
        setResults(response.items);
        setError("");
        setIsLoading(false);
        setIsSearching(false);
      } catch (error) {
        console.error("Search error:", error);
        setError(error instanceof Error ? error.message : "Failed to search");
        setResults([]);
        setIsLoading(false);
        setIsSearching(false);
      }
    };

    performSearch();

    return () => {
      // No need to clean up timers as search service handles debouncing internally
    };
  }, [query, isPagefindLoaded, searchService]);

  // Handle result selection - closes the search interface
  const handleResultSelect = () => {
    setIsOpen(false);
    setQuery("");
  };

  // Initialize the search service
  const initializeSearch = async () => {
    try {
      setIsLoading(true);

      if (environment.isDev()) {
        console.log("🔍 [SearchBar] Initializing search service...");
      }

      await searchService.init();
      setIsPagefindLoaded(true);
      setError("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      if (environment.isDev()) {
        console.error("🔍 [SearchBar] Error initializing search:", error);
      }
      setError(errorMessage);
      setIsPagefindLoaded(false);
    } finally {
      setIsLoading(false);
    }
  };

  // When new search results arrive, reset the selected index
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  return (
    <div className="relative flex justify-end lg:justify-start" ref={searchContainerRef}>
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
        results={results}
        resultsRef={resultsRef}
        onResultSelect={handleResultSelect}
        isLandingPage={isLandingPage}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
      />
    </div>
  );
}
