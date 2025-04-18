import { createFileRoute, useParams, useLoaderData } from "@tanstack/react-router";
import { DocsPage } from "@/components/docs";
import { type ProductName } from "@/lib/route-types";
import { docsPageLoader } from "@/lib/content/loaders";
import type { DocContent, DocMeta } from "@/lib/content/docs";
import DocsLayout from "@/components/docs/core/DocsLayout";
import { environment } from "@/lib/content/environment";
import ContentErrorHandler from "@/components/ContentErrorHandler";

export const Route = createFileRoute("/docs/$product/api/$")({
  component: DocsApiPage,

  // Use the docs loader with section parameter
  loader: ({ params }) => docsPageLoader({ params: { ...params, section: "api" } }),

  // Configure loading state
  pendingComponent: ({ params }) => {
    const { product, _splat } = params;

    // Parse the path into group/slug components
    const pathParts = _splat?.split("/").filter(Boolean) || [];

    // Extract group if it exists (first part of the splat)
    const group = pathParts.length > 0 ? pathParts[0] : null;

    // Extract current slug (last part) for sidebar highlighting
    const currentSlug = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "index";

    // Provide empty docs array
    const emptyDocs: DocMeta[] = [];

    return (
      <DocsLayout
        product={product as ProductName}
        section="api"
        slug={currentSlug}
        group={group}
        // Provide a minimal empty document for the loading state
        document={{
          meta: {
            title: "Loading...",
            description: "",
            slug: currentSlug,
            type: "doc",
            product: product as ProductName,
            path: "",
          },
          mdx: { code: "", frontmatter: {} },
          content: "",
        }}
        docs={emptyDocs}
      />
    );
  },
  errorComponent: ({ error }) => {
    environment.onError(error);
    return (
      <ContentErrorHandler
        error={error instanceof Error ? error : new Error(String(error))}
        contentType="docs"
      />
    );
  },
});

function DocsApiPage() {
  // Get the product and remaining path
  const { product, _splat } = useParams({ from: "/docs/$product/api/$" });

  // Get the loaded data from the loader
  const [document, docs] = useLoaderData({
    from: "/docs/$product/api/$",
    structuralSharing: false,
  }) as [DocContent, DocMeta[]];

  // For API routes, the section is always 'api'
  const section = "api";

  // Use the shared DocsPage component
  return (
    <DocsPage
      product={product as ProductName}
      section={section}
      splat={_splat || ""}
      document={document}
      docs={docs}
    />
  );
}
