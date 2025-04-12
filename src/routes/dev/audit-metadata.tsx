import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { routeToFilename } from "../../lib/utils";
import DevLayout from "@/components/dev/DevLayout";

export const Route = createFileRoute("/dev/audit-metadata")({
  component: AuditMetadata,
});

interface SEOMetadataItem {
  route: string;
  title: string;
  description: string | null;
  image?: string | null;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

type MetadataRecord = Record<string, SEOMetadataItem>;

function AuditMetadata() {
  const [metadata, setMetadata] = useState<MetadataRecord>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const response = await fetch("/seo-metadata.json");
        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.status}`);
        }
        const data = await response.json();
        setMetadata(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, []);

  const content = () => {
    if (loading) {
      return <div>Loading metadata...</div>;
    }

    if (error) {
      return <div className="text-red-500">Error: {error}</div>;
    }

    // Convert the record to an array for rendering
    const metadataItems = Object.keys(metadata).map((key) => metadata[key]);

    return (
      <>
        <h1 className="text-3xl font-bold mb-6">SEO Metadata Audit</h1>

        <p className="mb-6 text-gray-600">
          This page displays all routes with their SEO metadata for auditing purposes.
        </p>

        <div className="space-y-6">
          {metadataItems.map((item) => (
            <div key={item.route} className="border rounded-lg p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-5">
                  <div>
                    <span className="text-gray-500 mr-2">Route:</span>
                    <a
                      href={item.route}
                      className="text-blue-600 hover:underline break-all font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.route}
                    </a>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1">Title:</div>
                    <div className="font-medium text-lg">{item.title}</div>
                  </div>

                  <div>
                    <div className="text-gray-500 mb-1">Description:</div>
                    <div className="text-lg">{item.description}</div>
                  </div>
                </div>

                <div>
                  <div className="border rounded overflow-hidden">
                    <img
                      src={`/social-cards/${routeToFilename(item.route)}.webp`}
                      alt={`Social card for ${item.route}`}
                      className="w-full"
                      onError={(e) => {
                        // Hide the image if it fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.parentElement!.innerHTML =
                          '<div class="p-4 text-gray-500 italic">No social card available</div>';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <DevLayout>
      <div className="container py-8">{content()}</div>
    </DevLayout>
  );
}
