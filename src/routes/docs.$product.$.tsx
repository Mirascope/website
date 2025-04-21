import { createFileRoute, useParams, useLoaderData } from "@tanstack/react-router";
import { DocsPage } from "@/src/components/docs";
import { type ProductName } from "@/src/lib/route-types";
import { docsPageLoader } from "@/src/lib/content/loaders";
import type { DocContent, DocMeta } from "@/src/lib/content/docs";
import DocsLayout from "@/src/components/docs/core/DocsLayout";
import { environment } from "@/src/lib/content/environment";
import ContentErrorHandler from "@/src/components/ContentErrorHandler";

export const Route = createFileRoute("/docs/$product/$")({
  component: DocsProductPage,

  // Use the docs loader
  loader: ({ params }) => docsPageLoader({ params }),

  // Configure loading state
  pendingComponent: ({ params }) => {
    const { product, _splat } = params;

    // Parse the path into group/slug components
    const pathParts = _splat.split("/").filter(Boolean);

    // Extract group if it exists (first part of the splat)
    const group = pathParts.length > 0 ? pathParts[0] : null;

    // Extract current slug (last part) for sidebar highlighting
    const currentSlug = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "index";

    // Provide empty docs array
    const emptyDocs: DocMeta[] = [];

    return (
      <DocsLayout
        product={product as ProductName}
        section={null}
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

function DocsProductPage() {
  // Get the product and remaining path
  const { product, _splat } = useParams({ from: "/docs/$product/$" });

  // Get the loaded data from the loader
  const [document, docs] = useLoaderData({
    from: "/docs/$product/$",
    structuralSharing: false,
  }) as [DocContent, DocMeta[]];

  // No section for regular product routes
  const section = null;

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
