import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles } from "lucide-react";
import { getPostBySlug } from "@/lib/mdx";
import MDXContent from "@/components/MDXContent";
import TableOfContents from "@/components/TableOfContents";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
  loader: ({ params }) => {
    // No need to fetch the data here, but we validate the params
    // This ensures the route is registered correctly
    const { slug } = params;
    return { slug };
  },
});

function BlogPostPage() {
  const { slug } = useParams({ from: "/blog/$slug" });
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // TOC state for mobile
  const [tocOpen, setTocOpen] = useState(false);
  // Initialize fun mode from localStorage if available
  const [funMode, setFunMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("blogFunMode") === "true";
    }
    return false;
  });

  // Toggle fun mode (handwriting font for blog content)
  const toggleFunMode = () => {
    const newMode = !funMode;
    setFunMode(newMode);

    // Save preference to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("blogFunMode", newMode.toString());
    }
  };

  // Toggle table of contents on mobile
  const toggleToc = () => {
    setTocOpen(!tocOpen);
  };

  // Add visible logging for debugging
  console.log("BlogPostPage rendered with slug:", slug);

  useEffect(() => {
    console.log("Running effect with slug:", slug);

    const fetchPost = async () => {
      try {
        console.log("Fetching post with slug:", slug);

        try {
          const result = await getPostBySlug(slug);
          console.log("Got post data:", result);
          setPost(result ? { ...result.meta, content: result.content } : null);
        } catch (fetchErr) {
          console.error("Error in getPostBySlug:", fetchErr);
          setError(`Error fetching post: ${fetchErr.message}`);
        }
        setLoading(false);
      } catch (err) {
        console.error("General error fetching post:", err);
        setError(`Failed to load post: ${err.message}`);
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Rendering based on loading and error states
  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="flex mx-auto w-full max-w-7xl px-4">
          {/* Left empty sidebar for symmetry */}
          <div className="w-56 flex-shrink-0 hidden lg:block"></div>

          <div className="flex-1 min-w-0 flex justify-center items-center h-[calc(100vh-136px)]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>

          {/* Right TOC sidebar placeholder */}
          <div className="w-56 flex-shrink-0 hidden lg:block"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    // Create fallback post with just "Untitled Document" and nothing else
    const fallbackPost = {
      title: "Untitled Document",
      content: "",
      date: "",
      readTime: "",
      author: "",
    };

    return (
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row">
            {/* Left empty sidebar for symmetry - only on desktop */}
            <div className="w-56 flex-shrink-0 hidden lg:block"></div>

            {/* Main content area - full width on mobile */}
            <div className="flex-1 min-w-0 py-6">
              <div className="max-w-5xl mx-auto">
                <div className="mb-6">
                  <Link to="/blog" className="inline-block">
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Back to Blog
                    </Button>
                  </Link>
                </div>

                <div className="mb-6">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4">
                    {fallbackPost.title}
                  </h1>
                </div>

                <div
                  id="blog-content"
                  className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 blog-content"
                >
                  {/* Empty content as requested */}
                </div>
              </div>
            </div>

            {/* We don't need a TOC for Untitled Document */}
            <div className="w-56 flex-shrink-0 hidden lg:block">
              {/* Empty placeholder to maintain layout */}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Mobile TOC overlay - only show when TOC is open */}
      {tocOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setTocOpen(false)}
        ></div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row">
          {/* Left empty sidebar for symmetry - only on desktop */}
          <div className="w-56 flex-shrink-0 hidden lg:block"></div>

          {/* Main content area - full width on mobile */}
          <div className="flex-1 min-w-0 py-6">
            <div className="max-w-5xl mx-auto relative">
              {/* Mobile TOC/Fun Mode button */}
              <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40 lg:hidden">
                {/* Fun Mode mobile button */}
                <Button
                  variant={funMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleFunMode}
                  className={cn(
                    "rounded-full w-12 h-12 p-0 shadow-md",
                    funMode
                      ? "bg-primary text-white"
                      : "bg-white hover:bg-purple-50"
                  )}
                >
                  <Sparkles className="w-5 h-5" />
                </Button>

                {/* TOC toggle button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleToc}
                  className={cn(
                    "rounded-full w-12 h-12 p-0 shadow-md",
                    tocOpen ? "bg-gray-100" : "bg-white"
                  )}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </svg>
                </Button>
              </div>

              <div className="mb-6">
                <Link to="/blog" className="inline-block">
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back to Blog
                  </Button>
                </Link>
              </div>

              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4">
                  {post.title}
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {post.date} · {post.readTime} · By {post.author}
                </p>
                {post.lastUpdated && (
                  <p className="text-muted-foreground text-sm sm:text-base mt-1 italic">
                    Last updated: {post.lastUpdated}
                  </p>
                )}
              </div>

              <div
                id="blog-content"
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700 blog-content"
              >
                <MDXContent source={post.content} useFunMode={funMode} />
              </div>
            </div>
          </div>

          {/* Right TOC sidebar - fixed on desktop, slide-in panel on mobile */}
          <div className="w-56 flex-shrink-0 hidden lg:block">
            {/* Desktop fixed ToC */}
            <div className="fixed w-56 top-[96px] h-[calc(100vh-60px)] overflow-hidden">
              <div className="flex flex-col h-full">
                {/* Fixed header section with Fun Mode button */}
                <div className="flex flex-col gap-3 mb-4 pt-6 px-4 bg-white dark:bg-gray-900">
                  <Button
                    variant={funMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleFunMode}
                    className={cn(
                      funMode ? "bg-primary text-white" : "hover:bg-purple-50",
                      "transition-colors w-full"
                    )}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Fun Mode
                  </Button>

                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    On this page
                  </h4>
                </div>

                {/* Scrollable table of contents */}
                <div className="overflow-y-auto pr-4 pl-4 pb-6 flex-grow">
                  <TableOfContents
                    contentId="blog-content"
                    product="mirascope"
                    section="blog"
                    slug={slug}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile slide-in TOC panel */}
          <div
            className={`
            fixed top-0 right-0 w-72 h-full z-40 bg-white dark:bg-gray-900 shadow-lg border-l border-gray-200 dark:border-gray-700
            ${tocOpen ? "translate-x-0" : "translate-x-full"}
            transition-transform duration-300 ease-in-out
            lg:hidden
          `}
          >
            {/* Mobile TOC content */}
            <div className="flex flex-col h-full">
              {/* Mobile close button */}
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="font-medium">Table of Contents</h3>
                <button
                  onClick={() => setTocOpen(false)}
                  className="p-1 rounded-md hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Mobile scrollable table of contents */}
              <div className="overflow-y-auto flex-grow px-4 py-4">
                <TableOfContents
                  contentId="blog-content"
                  product="mirascope"
                  section="blog"
                  slug={slug}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
