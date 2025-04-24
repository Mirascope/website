import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import DevLayout from "@/src/components/dev/DevLayout";
import { environment } from "@/src/lib/content/environment";
import { getAllDevMeta } from "@/src/lib/content";
import ContentErrorHandler from "@/src/components/ContentErrorHandler";
import { LoadingContent } from "@/src/components/docs";

export const Route = createFileRoute("/dev/")({
  component: DevIndexPage,
  loader: async () => {
    try {
      // Get all MDX-based dev pages for the sidebar
      const devPages = await getAllDevMeta();
      return { devPages };
    } catch (error) {
      console.error("Error loading dev pages:", error);
      return { devPages: [] };
    }
  },
  pendingComponent: () => {
    return (
      <DevLayout devPages={[]}>
        <div className="container py-8">
          <LoadingContent spinnerClassName="h-12 w-12" fullHeight={false} />
        </div>
      </DevLayout>
    );
  },
  errorComponent: ({ error }) => {
    environment.onError(error);
    return (
      <ContentErrorHandler
        error={error instanceof Error ? error : new Error(String(error))}
        contentType="dev"
      />
    );
  },
});

function DevIndexPage() {
  const { devPages } = useLoaderData({ from: "/dev/" });

  return (
    <DevLayout devPages={devPages}>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Developer Tools</h1>

        <p className="mb-6">
          Welcome to the developer section. This area contains tools for developing and maintaining
          the website, and is hidden from sitemap.xml.
        </p>

        <div className="space-y-4">
          {/* Hardcoded tool routes */}
          <div className="border rounded-lg p-6 shadow-sm">
            <a href="/dev/audit-metadata" className="hover:underline">
              <h2 className="text-xl font-semibold mb-2 text-primary">SEO Metadata Audit</h2>
            </a>
            <p className="mb-4">View and audit SEO metadata for all website routes.</p>
          </div>

          <div className="border rounded-lg p-6 shadow-sm">
            <a href="/dev/social-card" className="hover:underline">
              <h2 className="text-xl font-semibold mb-2 text-primary">Social Card Preview</h2>
            </a>
            <p className="mb-4">
              Preview how social cards will look with different titles. Useful for iterating on the
              social-card.html file.
            </p>
          </div>

          {/* Style test pages section */}
          {devPages.length > 0 && (
            <>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Style Tests</h2>
              <div className="space-y-4">
                {devPages.map((page) => (
                  <div key={page.slug} className="border rounded-lg p-6 shadow-sm">
                    <a href={`/dev/${page.slug}`} className="hover:underline">
                      <h2 className="text-xl font-semibold mb-2 text-primary">{page.title}</h2>
                    </a>
                    <p className="mb-4">{page.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DevLayout>
  );
}
