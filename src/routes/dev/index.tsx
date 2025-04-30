import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import DevLayout from "@/src/components/dev/DevLayout";
import { environment } from "@/src/lib/content/environment";
import ContentErrorHandler from "@/src/components/ContentErrorHandler";
import { LoadingContent } from "@/src/components/docs";

export const Route = createFileRoute("/dev/")({
  component: DevIndexPage,
  // No loader needed since we use the parent route's loader
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
  // Get devPages from parent route's loader
  const { devPages } = useLoaderData({ from: "/dev" });

  return (
    <DevLayout devPages={devPages}>
      <div className="container py-8">
        <h1 className="mb-6 text-3xl font-bold">Developer Tools</h1>

        <p className="mb-6">
          Welcome to the developer section. This area contains tools for developing and maintaining
          the website, and is hidden from sitemap.xml.
        </p>

        <div className="space-y-4">
          {/* Hardcoded tool routes */}
          <div className="rounded-lg border p-6 shadow-sm">
            <a href="/dev/audit-metadata" className="hover:underline">
              <h2 className="text-primary mb-2 text-xl font-semibold">SEO Metadata Audit</h2>
            </a>
            <p className="mb-4">View and audit SEO metadata for all website routes.</p>
          </div>

          <div className="rounded-lg border p-6 shadow-sm">
            <a href="/dev/social-card" className="hover:underline">
              <h2 className="text-primary mb-2 text-xl font-semibold">Social Card Preview</h2>
            </a>
            <p className="mb-4">
              Preview how social cards will look with different titles. Useful for iterating on the
              social-card.html file.
            </p>
          </div>

          {/* Style test pages section */}
          {devPages.length > 0 && (
            <>
              <h2 className="mt-8 mb-4 text-2xl font-semibold">Style Tests</h2>
              <div className="space-y-4">
                {devPages.map((page) => (
                  <div key={page.slug} className="rounded-lg border p-6 shadow-sm">
                    <a href={`/dev/${page.slug}`} className="hover:underline">
                      <h2 className="text-primary mb-2 text-xl font-semibold">{page.title}</h2>
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
