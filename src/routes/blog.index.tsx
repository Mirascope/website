import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { useState } from "react";
import { type BlogMeta, getAllBlogMeta } from "@/src/lib/content";
import { SEOMeta, LoadingContent, ContentErrorHandler } from "@/src/components";
import { environment } from "@/src/lib/content/environment";

// Posts per page
const POSTS_PER_PAGE = 4;

/**
 * Blog list loader that fetches all blog metadata
 */
async function blogListLoader() {
  try {
    return await getAllBlogMeta();
  } catch (error) {
    console.error("Error loading blog list:", error);
    throw error;
  }
}

export const Route = createFileRoute("/blog/")({
  component: BlogPage,

  // Use our inline loader
  loader: blogListLoader,

  // Configure loading state
  pendingComponent: () => (
    <div className="flex justify-center">
      <div className="mx-auto flex w-full max-w-[1800px] px-4 pt-6">
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <h1 className="mb-4 text-center text-4xl font-bold">Blog</h1>
              <p className="text-foreground mx-auto max-w-2xl text-xl">
                The latest news, updates, and insights about
                <br />
                Mirascope and LLM application development.
              </p>
            </div>
            <div className="flex h-64 items-center justify-center">
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
    <div className="flex justify-center">
      <SEOMeta
        title="Blog"
        description="The latest news, updates, and insights about Mirascope and LLM application development."
        url="/blog"
        type="website"
      />
      <div className="mx-auto flex w-full max-w-[1800px] px-4 pt-6">
        <div className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <h1 className="mb-4 text-center text-4xl font-bold">Blog</h1>
              <p className="text-foreground mx-auto max-w-2xl text-xl">
                The latest news, updates, and insights about
                <br />
                Mirascope and LLM application development.
              </p>
            </div>

            <div className="mb-10 min-h-[700px]">
              {posts.length === 0 ? (
                <div className="py-12 text-center">
                  <h2 className="text-foreground text-xl font-medium">No posts found</h2>
                  <p className="text-foreground mt-2">Check back soon for new content!</p>
                </div>
              ) : (
                <div className="grid min-h-[650px] grid-cols-1 gap-8 md:grid-cols-2">
                  {currentPosts.map((post) => (
                    <Link
                      key={post.slug}
                      to="/blog/$slug"
                      params={{ slug: post.slug }}
                      className="group block h-full cursor-pointer"
                    >
                      <div className="bg-card border-border flex h-[320px] flex-col overflow-hidden rounded-lg border-1 shadow-sm transition-all duration-200 hover:shadow-lg">
                        <div className="flex h-full flex-col p-6">
                          <div>
                            <h3 className="group-hover:text-primary mb-2 text-xl font-semibold transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-muted-foreground mb-4 text-sm select-none">
                              {post.date} · {post.readTime} · By {post.author}
                            </p>
                            <p className="text-foreground mb-4 line-clamp-3 select-none">
                              {post.description}
                            </p>
                          </div>
                          <span className="text-accent-foreground group-hover:text-primary mt-auto font-medium transition-colors">
                            Read more
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}

                  {/* Spacer elements to maintain grid layout when fewer than POSTS_PER_PAGE posts */}
                  {[...Array(Math.max(0, POSTS_PER_PAGE - currentPosts.length))].map((_, index) => (
                    <div key={`spacer-${index}`} className="invisible h-[320px] md:h-[320px]" />
                  ))}
                </div>
              )}
            </div>

            {posts.length > 0 && (
              <div className="w-full border-t pt-4 pb-8">
                <div className="flex justify-center">
                  <nav className="flex gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`border-border rounded border px-3 py-1 font-medium ${currentPage === 1 ? "cursor-not-allowed opacity-50" : "hover:bg-muted cursor-pointer"}`}
                    >
                      Previous
                    </button>

                    {Array.from({ length: Math.max(1, totalPages) }, (_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => handlePageChange(i + 1)}
                        className={`flex h-8 w-8 items-center justify-center rounded font-medium ${
                          currentPage === i + 1
                            ? "bg-primary text-primary-foreground"
                            : "border-border hover:bg-muted border"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`border-border rounded border px-3 py-1 font-medium ${currentPage === totalPages ? "cursor-not-allowed opacity-50" : "hover:bg-muted cursor-pointer"}`}
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
