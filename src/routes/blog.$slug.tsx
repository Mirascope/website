import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles } from "lucide-react";
import { getPostBySlug } from "@/lib/mdx";
import { MDXRenderer } from "@/components/MDXRenderer";
import { LoadingContent } from "@/components/docs";
import ErrorContent from "@/components/ErrorContent";
import useFunMode from "@/lib/hooks/useFunMode";
import useMDXProcessor from "@/lib/hooks/useMDXProcessor";
import useSEO from "@/lib/hooks/useSEO";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
  loader: ({ params }) => {
    const { slug } = params;
    return { slug };
  },
});

function BlogPostPage() {
  const { slug } = useParams({ from: "/blog/$slug" });
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [ogImage, setOgImage] = useState<string | undefined>(undefined);

  // Use custom hooks
  const [funMode, toggleFunMode] = useFunMode();
  const { compiledMDX } = useMDXProcessor(post?.content, post);

  // Find the first available image in the blog post directory
  useEffect(() => {
    const findOgImage = async () => {
      try {
        const response = await fetch(`/assets/blog/${slug}/`);
        if (response.ok) {
          const text = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, "text/html");
          const links = Array.from(doc.querySelectorAll("a"))
            .map((a) => a.getAttribute("href"))
            .filter((href) => href && /\.(png|jpg|jpeg|gif)$/i.test(href));

          if (links.length > 0) {
            setOgImage(`/assets/blog/${slug}/${links[0]}`);
          }
        }
      } catch (err) {
        console.error("Error finding OG image:", err);
      }
    };

    if (post) {
      findOgImage();
    }
  }, [post, slug]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const result = await getPostBySlug(slug);
        if (!result) {
          setError("Post not found");
          setLoading(false);
          return;
        }

        setPost({ ...result.meta, content: result.content });
      } catch (err) {
        console.error("Error fetching post:", err);
        setError(`Failed to load post: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Apply SEO
  useSEO({
    title: loading ? "Loading..." : error ? "Post Not Found" : post?.title,
    description: error
      ? "The requested blog post could not be found."
      : post?.description || post?.excerpt,
    image: ogImage,
    url: `/blog/${slug}`,
    type: "article",
    article: post
      ? {
          publishedTime: post.date,
          modifiedTime: post.lastUpdated,
          author: post.author,
          tags: post.tags,
        }
      : undefined,
  });

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="flex mx-auto w-full max-w-7xl px-4">
          <div className="w-56 flex-shrink-0 hidden lg:block"></div>
          <LoadingContent className="flex-1 min-w-0" fullHeight={true} />
          <div className="w-56 flex-shrink-0 hidden lg:block"></div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row">
            <div className="w-56 flex-shrink-0 hidden lg:block"></div>
            <ErrorContent
              title="Post Not Found"
              message={error}
              showBackButton={true}
              backTo="/blog"
              backLabel="Back to Blog"
            />
            <div className="w-56 flex-shrink-0 hidden lg:block"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {tocOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setTocOpen(false)}
        ></div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row">
          <div className="w-56 flex-shrink-0 hidden lg:block"></div>
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
                {compiledMDX ? (
                  <MDXRenderer
                    code={compiledMDX.code}
                    frontmatter={compiledMDX.frontmatter}
                    useFunMode={funMode}
                  />
                ) : (
                  <div className="animate-pulse bg-gray-100 h-40 rounded-md"></div>
                )}
              </div>
            </div>
          </div>
          <div className="w-56 flex-shrink-0 hidden lg:block">
            <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40 lg:hidden">
              <Button
                variant={funMode ? "default" : "outline"}
                size="sm"
                onClick={toggleFunMode}
                className={cn(
                  "rounded-full w-12 h-12 p-0 shadow-md",
                  funMode ? "bg-primary text-white" : "bg-white hover:bg-purple-50"
                )}
              >
                <Sparkles className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
