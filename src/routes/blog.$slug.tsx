import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { getPostBySlug } from "@/lib/mdx";
import MDXContent from "@/components/MDXContent";

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
      <div className="flex justify-center items-center h-[calc(100vh-136px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-136px)]">
        <h1 className="text-2xl font-medium mb-4">Post Not Found</h1>
        <p className="text-muted-foreground mb-6">
          {error || "The blog post you're looking for doesn't exist."}
        </p>
        <Link to="/blog">
          <Button>Back to Blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 min-h-[calc(100vh-136px)]">
      <div className="mb-6">
        <Link to="/blog" className="inline-block">
          <Button variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to Blog
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-normal mb-2">{post.title}</h1>
        <p className="text-muted-foreground">
          {post.date} · {post.readTime}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 blog-content">
        <MDXContent source={post.content} />
      </div>
    </div>
  );
}
