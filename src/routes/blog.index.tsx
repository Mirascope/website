import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getAllPosts } from "@/lib/mdx";
import type { PostMeta } from "@/lib/mdx";

// Posts per page
const POSTS_PER_PAGE = 6;

export const Route = createFileRoute("/blog/")({
  component: BlogPage,
});

function BlogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Load posts from the MDX files
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const allPosts = await getAllPosts();
        setPosts(allPosts);
        setLoading(false);
      } catch (error) {
        console.error("Error loading blog posts:", error);
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

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

  // // No need to pre-generate pagination items - we do this inline now

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 text-center">Blog</h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            The latest news, updates, and insights about Mirascope and LLM
            application development.
          </p>
        </div>

        <div className="mb-10 min-h-[800px]">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium text-gray-600">
                No posts found
              </h2>
              <p className="text-muted-foreground mt-2">
                Check back soon for new content!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentPosts.map((post, index) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="block h-full cursor-pointer group"
                >
                  <div className="h-full flex flex-col hover:shadow-lg transition-all duration-200 shadow-sm bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 select-none">
                        {post.date} · {post.readTime} · By {post.author}
                      </p>
                      <p className="text-gray-600 mb-4 select-none">
                        {post.description}
                      </p>
                      <span className="text-primary font-medium">
                        Read more
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
              
              {/* Spacer elements to maintain grid layout when fewer than POSTS_PER_PAGE posts */}
              {[...Array(Math.max(0, POSTS_PER_PAGE - currentPosts.length))].map((_, index) => (
                <div key={`spacer-${index}`} className="h-0 md:h-auto" />
              ))}
            </div>
          )}
        </div>

        {!loading && posts.length > 0 && (
          <div className="mt-8 py-4 border-t w-full">
            <div className="flex justify-center">
              <nav className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded border font-medium ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"}`}
                >
                  Previous
                </button>

                {Array.from({ length: Math.max(1, totalPages) }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded font-medium ${
                      currentPage === i + 1
                        ? "bg-primary text-white"
                        : "border hover:bg-gray-100"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded border font-medium ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"}`}
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
