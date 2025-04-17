import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Sparkles } from "lucide-react";
import { MDXRenderer } from "@/components/MDXRenderer";
import { LoadingContent } from "@/components/docs";
import ErrorContent from "@/components/ErrorContent";
import useFunMode from "@/lib/hooks/useFunMode";
import useSEO from "@/lib/hooks/useSEO";
import { cn } from "@/lib/utils";
import { getBlogContent } from "@/lib/content/blog";

// Create a resource cache to store suspense data
const cache = new Map();

// Helper to create suspense resources
function createResource<T>(key: string, fetcher: () => Promise<T>) {
  if (!cache.has(key)) {
    let data: T | null = null;
    let error: Error | null = null;
    let promise: Promise<void> | null = null;

    const resource = {
      read() {
        if (error) throw error;
        if (data) return data;
        if (!promise) {
          promise = fetcher()
            .then((result) => {
              data = result;
            })
            .catch((e) => {
              error = e instanceof Error ? e : new Error(String(e));
            });
        }
        throw promise;
      },
    };

    cache.set(key, resource);
  }

  return cache.get(key);
}

// Blog post content component that uses Suspense
function BlogPostContent({ slug }: { slug: string }) {
  // Create resource for the blog post
  const postResource = createResource(`blog:${slug}`, () => getBlogContent(slug));

  // Read the post (this will throw and suspend if data isn't ready)
  const post = postResource.read();

  const [tocOpen, setTocOpen] = useState(false);
  const [ogImage, setOgImage] = useState<string | undefined>(undefined);

  // Use fun mode
  const [funMode, toggleFunMode] = useFunMode();

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

    findOgImage();
  }, [slug]);

  // Apply SEO
  useSEO({
    title: post.meta.title,
    description: post.meta.description || post.mdx?.frontmatter?.excerpt,
    image: ogImage,
    url: `/blog/${slug}`,
    type: "article",
    article: {
      publishedTime: post.meta.date,
      modifiedTime: post.meta.lastUpdated,
      author: post.meta.author,
    },
  });

  // Extract metadata for easier access
  const { title, date, readTime, author, lastUpdated } = post.meta;

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
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4">{title}</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {date} · {readTime} · By {author}
                </p>
                {lastUpdated && (
                  <p className="text-muted-foreground text-sm sm:text-base mt-1 italic">
                    Last updated: {lastUpdated}
                  </p>
                )}
              </div>
              <div
                id="blog-content"
                className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700 blog-content"
              >
                {post.mdx ? (
                  <MDXRenderer
                    code={post.mdx.code}
                    frontmatter={post.mdx.frontmatter}
                    useFunMode={funMode}
                  />
                ) : (
                  <LoadingContent spinnerClassName="h-8 w-8" fullHeight={false} />
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

// Error fallback component for when blog post loading fails
function BlogPostError({ slug, error }: { slug: string; error: string }) {
  // Apply SEO for error state
  useSEO({
    title: "Post Not Found",
    description: "The requested blog post could not be found.",
    url: `/blog/${slug}`,
  });

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

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
  loader: ({ params }) => {
    const { slug } = params;
    return { slug };
  },
});

function BlogPostPage() {
  const { slug } = useParams({ from: "/blog/$slug" });

  // Custom error boundary pattern using React.Suspense and try/catch
  try {
    return (
      <Suspense
        fallback={
          <div className="flex justify-center">
            <div className="flex mx-auto w-full max-w-7xl px-4">
              <div className="w-56 flex-shrink-0 hidden lg:block"></div>
              <LoadingContent className="flex-1 min-w-0" fullHeight={true} />
              <div className="w-56 flex-shrink-0 hidden lg:block"></div>
            </div>
          </div>
        }
      >
        <BlogPostContent slug={slug} />
      </Suspense>
    );
  } catch (error) {
    return (
      <BlogPostError slug={slug} error={error instanceof Error ? error.message : String(error)} />
    );
  }
}
