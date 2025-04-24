import { createFileRoute, useParams, Link, useLoaderData } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { ChevronLeft, Sparkles, Clipboard, Check } from "lucide-react";
import { MDXRenderer } from "@/src/components/MDXRenderer";
import { LoadingContent } from "@/src/components/docs";
import ContentErrorHandler from "@/src/components/ContentErrorHandler";
import TableOfContents from "@/src/components/TableOfContents";
import SEOMeta from "@/src/components/SEOMeta";
import useFunMode from "@/src/lib/hooks/useFunMode";
import { cn } from "@/src/lib/utils";
import { getBlogContent } from "@/src/lib/content";
import analyticsManager from "@/src/lib/services/analytics";
import type { BlogContent } from "@/src/lib/content";
import { environment } from "@/src/lib/content/environment";

/**
 * Blog content loader that directly calls getBlogContent
 */
async function blogLoader({ params }: { params: { slug: string } }) {
  try {
    return await getBlogContent(`/blog/${params.slug}`);
  } catch (error) {
    console.error(`Error loading blog: ${params.slug}`, error);
    throw error;
  }
}

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,

  // Use our inline loader
  loader: blogLoader,

  // Configure loading state
  pendingComponent: () => (
    <div className="flex justify-center">
      <div className="flex mx-auto w-full max-w-7xl px-4">
        <div className="w-56 flex-shrink-0 hidden lg:block"></div>
        <LoadingContent className="flex-1 min-w-0" fullHeight={true} />
        <div className="w-56 flex-shrink-0 hidden lg:block"></div>
      </div>
    </div>
  ),

  // Configure error handling
  errorComponent: ({ error }) => {
    environment.onError(error);
    return (
      <ContentErrorHandler
        error={error instanceof Error ? error : new Error(String(error))}
        contentType="blog"
      />
    );
  },
  onError: (error: Error) => environment.onError(error),
});

function BlogPostPage() {
  const { slug } = useParams({ from: "/blog/$slug" });

  // Access the loaded content directly
  const post = useLoaderData({ from: "/blog/$slug", structuralSharing: false }) as BlogContent;

  const [tocOpen, setTocOpen] = useState(false);
  const [ogImage, setOgImage] = useState<string | undefined>(undefined);
  const [isCopied, setIsCopied] = useState(false);

  // Use fun mode
  const [funMode, toggleFunMode] = useFunMode();

  // Copy post content as Markdown
  const copyContentAsMarkdown = () => {
    if (post.content) {
      navigator.clipboard
        .writeText(post.content)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => {
            setIsCopied(false);
          }, 2000);

          const pagePath = window.location.pathname;

          // Using GA4 standard "select_content" event with recommended parameters
          analyticsManager.trackEvent("select_content", {
            content_type: "blog_markdown",
            item_id: slug,
            product: "blog",
            page_path: pagePath,
          });
        })
        .catch((err) => {
          console.error("Failed to copy content: ", err);
        });
    }
  };

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

  // Extract metadata for easier access
  const { title, date, readTime, author, lastUpdated, path } = post.meta;

  return (
    <div className="relative">
      <SEOMeta
        title={post.meta.title}
        description={post.meta.description || post.mdx?.frontmatter?.excerpt}
        image={ogImage}
        url={`/blog/${slug}`}
        type="article"
        article={{
          publishedTime: post.meta.date,
          modifiedTime: post.meta.lastUpdated,
          author: post.meta.author,
        }}
      />
      {tocOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-30 lg:hidden"
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
                className="bg-background rounded-xl shadow-sm p-4 sm:p-6 border border-border blog-content"
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
            {/* Desktop fixed ToC */}
            <div className="fixed w-56 top-[96px] h-[calc(100vh-96px)] overflow-hidden">
              <div className="flex flex-col h-full">
                {/* Fixed header section with Fun Mode button */}
                <div className="flex flex-col gap-3 mb-4 pt-6 px-4 bg-background">
                  <Button
                    variant={funMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleFunMode}
                    className={cn(
                      funMode ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                      "transition-colors w-full"
                    )}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Fun Mode
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyContentAsMarkdown}
                    disabled={isCopied}
                    className="w-full"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-4 h-4 mr-1" />
                        Copy as Markdown
                      </>
                    )}
                  </Button>

                  <h4 className="text-sm font-medium text-muted-foreground mt-3">On this page</h4>
                </div>

                {/* Scrollable table of contents */}
                <div className="overflow-y-auto pr-4 pl-4 pb-6 flex-grow">
                  <TableOfContents contentId="blog-content" path={path} />
                </div>
              </div>
            </div>

            {/* Mobile buttons (Fun Mode & ToC) */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-40 lg:hidden">
              {/* Fun Mode mobile button */}
              <Button
                variant={funMode ? "default" : "outline"}
                size="sm"
                onClick={toggleFunMode}
                className={cn(
                  "rounded-full w-12 h-12 p-0 shadow-md",
                  funMode ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                )}
              >
                <Sparkles className="w-5 h-5" />
              </Button>

              {/* ToC toggle button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTocOpen(!tocOpen)}
                className={cn(
                  "rounded-full w-12 h-12 p-0 shadow-md",
                  tocOpen ? "bg-muted" : "bg-background"
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

            {/* Mobile slide-in TOC panel */}
            <div
              className={`
              fixed top-0 right-0 w-72 h-full z-40 bg-background shadow-lg border-l border-border
              ${tocOpen ? "translate-x-0" : "translate-x-full"}
              transition-transform duration-300 ease-in-out
              lg:hidden
            `}
            >
              {/* Mobile TOC content */}
              <div className="flex flex-col h-full">
                {/* Mobile close button */}
                <div className="flex justify-between items-center p-4 border-b border-border">
                  <h3 className="font-medium">Table of Contents</h3>
                  <button
                    onClick={() => setTocOpen(false)}
                    className="p-1 rounded-md hover:bg-muted"
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

                {/* Copy as Markdown button */}
                <div className="px-4 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyContentAsMarkdown}
                    disabled={isCopied}
                    className="w-full"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-4 h-4 mr-1" />
                        Copy as Markdown
                      </>
                    )}
                  </Button>
                </div>

                {/* Mobile scrollable table of contents */}
                <div className="overflow-y-auto flex-grow px-4 py-4">
                  <TableOfContents contentId="blog-content" path={path} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
