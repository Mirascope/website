import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { useState } from "react";
import { type BlogMeta } from "@/lib/content/blog";
import { blogListLoader } from "@/lib/content/loaders";
import SEOHelmet from "@/components/SEOHelmet";
import { LoadingContent } from "@/components/docs";
import { environment } from "@/lib/content/environment";
import ContentErrorHandler from "@/components/ContentErrorHandler";

// Posts per page
const POSTS_PER_PAGE = 4;

export const Route = createFileRoute("/blog/")({
  component: BlogPage,

  // Load blog posts list
  loader: blogListLoader,

  // Configure loading state
  pendingComponent: () => (
    <div className="flex justify-center pt-6">
      <div className="flex mx-auto w-full max-w-[1800px] px-4">
        <div className="flex-1 min-w-0 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 text-center">Blog</h1>
              <p className="text-xl text-foreground max-w-2xl mx-auto">
                The latest news, updates, and insights about
                <br />
                Mirascope and LLM application development.
              </p>
            </div>
            <div className="flex justify-center items-center h-64">
              <LoadingContent spinnerClassName="h-12 w-12" fullHeight={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
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

function BlogPage() {
  // Access the loaded posts directly
  const posts = useLoaderData({ from: "/blog/", structuralSharing: false }) as BlogMeta[];

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

  // Get posts for the current page
  const startIdx = (currentPage - 1) * POSTS_PER_PAGE;
  const endIdx = startIdx + POSTS_PER_PAGE;
  const currentPosts = posts.slice(startIdx, endIdx);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex justify-center pt-6">
      <SEOHelmet
        title="Blog"
        description="The latest news, updates, and insights about Mirascope and LLM application development."
        url="/blog"
        type="website"
      />
      <div className="flex mx-auto w-full max-w-[1800px] px-4">
        <div className="flex-1 min-w-0 py-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4 text-center">Blog</h1>
              <p className="text-xl text-foreground max-w-2xl mx-auto">
                The latest news, updates, and insights about
                <br />
                Mirascope and LLM application development.
              </p>
            </div>

            <div className="mb-10 min-h-[700px]">
              {posts.length === 0 ? (
                <div className="text-center py-12">
                  <h2 className="text-xl font-medium text-foreground">No posts found</h2>
                  <p className="text-foreground mt-2">Check back soon for new content!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[650px]">
                  {currentPosts.map((post) => (
                    <Link
                      key={post.slug}
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="block h-full cursor-pointer group"
                    >
                      <div className="h-[320px] flex flex-col hover:shadow-lg transition-all duration-200 shadow-sm bg-accent rounded-lg border-1 border-primary overflow-hidden">
                        <div className="p-6 flex flex-col h-full">
                          <div>
                            <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4 select-none">
                              {post.date} · {post.readTime} · By {post.author}
                            </p>
                            <p className="text-foreground mb-4 select-none line-clamp-3">
                              {post.description}
                            </p>
                          </div>
                          <span className="text-accent-foreground group-hover:text-primary transition-colors font-medium mt-auto">
                            Read more
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}

                  {/* Spacer elements to maintain grid layout when fewer than POSTS_PER_PAGE posts */}
                  {[...Array(Math.max(0, POSTS_PER_PAGE - currentPosts.length))].map((_, index) => (
                    <div key={`spacer-${index}`} className="h-[320px] md:h-[320px] invisible" />
                  ))}
                </div>
              )}
            </div>

            {posts.length > 0 && (
              <div className="pb-8 pt-4 border-t w-full">
                <div className="flex justify-center">
                  <nav className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded border border-border font-medium ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted"}`}
                    >
                      Previous
                    </button>

                    {Array.from({ length: Math.max(1, totalPages) }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded font-medium ${
                          currentPage === i + 1
                            ? "bg-primary text-primary-foreground"
                            : "border border-border hover:bg-muted"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded border border-border font-medium ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-muted"}`}
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
