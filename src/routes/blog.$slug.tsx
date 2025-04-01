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
  // Initialize fun mode from localStorage if available
  const [funMode, setFunMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('blogFunMode') === 'true';
    }
    return false;
  });
  
  // Toggle fun mode (handwriting font for blog content)
  const toggleFunMode = () => {
    const newMode = !funMode;
    setFunMode(newMode);
    
    // Save preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('blogFunMode', newMode.toString());
    }
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
    return (
      <div className="flex justify-center">
        <div className="flex mx-auto w-full max-w-7xl px-4">
          {/* Left empty sidebar for symmetry */}
          <div className="w-56 flex-shrink-0 hidden lg:block"></div>
          
          <div className="flex-1 min-w-0 flex flex-col justify-center items-center h-[calc(100vh-136px)]">
            <h1 className="text-2xl font-medium mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "The blog post you're looking for doesn't exist."}
            </p>
            <Link to="/blog">
              <Button>Back to Blog</Button>
            </Link>
          </div>
          
          {/* Right TOC sidebar placeholder */}
          <div className="w-56 flex-shrink-0 hidden lg:block"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="flex mx-auto w-full max-w-7xl px-4">
        {/* Left empty sidebar for symmetry */}
        <div className="w-56 flex-shrink-0 hidden lg:block"></div>
        
        {/* Main content area */}
        <div className="flex-1 min-w-0 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex gap-2">
              <Link to="/blog" className="inline-block">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back to Blog
                </Button>
              </Link>
              <Button 
                variant={funMode ? "default" : "outline"} 
                size="sm" 
                onClick={toggleFunMode}
                className={cn(
                  funMode ? "bg-primary text-white" : "hover:bg-purple-50",
                  "transition-colors"
                )}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Fun Mode
              </Button>
            </div>

            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-semibold mb-2">
                {post.title}
              </h1>
              <p className="text-muted-foreground">
                {post.date} · {post.readTime} · By {post.author}
              </p>
            </div>

            <div 
              id="blog-content"
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 blog-content"
            >
              <MDXContent source={post.content} useFunMode={funMode} />
            </div>
          </div>
        </div>
        
        {/* Right TOC sidebar - only visible on lg and larger screens */}
        <div className="w-56 flex-shrink-0 hidden lg:block">
          <div className="fixed w-56 max-h-[calc(100vh-60px)] overflow-y-auto">
            <div className="px-4">
              <h4 className="text-sm font-medium mb-4 text-gray-500">
                On this page
              </h4>
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
  );
}
