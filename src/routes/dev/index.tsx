import { createFileRoute } from "@tanstack/react-router";
import DevLayout from "@/components/dev/DevLayout";

export const Route = createFileRoute("/dev/")({
  component: DevIndexPage,
});

function DevIndexPage() {
  return (
    <DevLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Developer Tools</h1>

        <p className="mb-6 text-gray-600">
          Welcome to the developer section. This area contains tools for developing and maintaining
          the website, and is hidden from sitemap.xml.
        </p>

        <div className="space-y-4">
          <div className="border rounded-lg p-6 shadow-sm">
            <a href="/dev/audit-metadata" className="hover:underline">
              <h2 className="text-xl font-semibold mb-2 text-blue-600">SEO Metadata Audit</h2>
            </a>
            <p className="text-gray-600 mb-4">
              View and audit SEO metadata for all website routes.
            </p>
          </div>

          <div className="border rounded-lg p-6 shadow-sm">
            <a href="/dev/social-card" className="hover:underline">
              <h2 className="text-xl font-semibold mb-2 text-blue-600">Social Card Preview</h2>
            </a>
            <p className="text-gray-600 mb-4">
              Preview how social cards will look with different titles. Useful for iterating on the
              social-card.html file to preview changes to social cards and testing font sizing
              rules.
            </p>
          </div>

          <div className="border rounded-lg p-6 shadow-sm">
            <a href="/dev/style-test" className="hover:underline">
              <h2 className="text-xl font-semibold mb-2 text-blue-600">Style Test Page</h2>
            </a>
            <p className="text-gray-600 mb-4">
              Comprehensive showcase of all UI components and styles for visual consistency testing
              across themes. Includes typography, MDX components, and UI elements.
            </p>
          </div>
        </div>
      </div>
    </DevLayout>
  );
}
