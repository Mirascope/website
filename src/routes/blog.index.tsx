import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { type BlogMeta, getAllBlogMeta } from "@/src/lib/content";
import { LoadingContent, ContentErrorHandler } from "@/src/components";
import { environment } from "@/src/lib/content/environment";
import { BlogIndexPage } from "@/src/components/routes/blog";

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
  // Use our inline loader
  loader: blogListLoader,

  component: () => {
    // Access the loaded posts directly
    const posts = useLoaderData({ from: "/blog/", structuralSharing: false }) as BlogMeta[];
    return <BlogIndexPage posts={posts} />;
  },

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
