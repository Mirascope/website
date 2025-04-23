import { loadContent } from "./content-loader";
import type { DocMeta, DocContent } from "./content-types";

// Re-export type definitions
export type { DocMeta, DocContent };

// Import product docs metadata
import docsSpec from "@/content/doc/_meta";
import type { DocSpec } from "@/src/lib/content/spec";

/**
 * Get doc content by path using the spec format
 * Works with the simplified URL structure
 */
export async function getDoc(path: string): Promise<DocContent> {
  // Normalize to doc/ prefix format
  const docPath = !path.startsWith("/doc/") ? `/doc/${path}` : path;

  return loadContent<DocMeta>(docPath, "doc");
}

/**
 * Process a doc specification and build DocMeta items
 * @param docSpec Doc specification
 * @param product Product this doc belongs to
 * @param pathPrefix Base path for this doc
 * @returns Array of DocMeta items from this doc and its children
 */
function processDocSpec(docSpec: DocSpec, product: string, pathPrefix: string = ""): DocMeta[] {
  const result: DocMeta[] = [];

  // Build the path for this doc
  const docPath = pathPrefix ? `${pathPrefix}/${docSpec.slug}` : `${product}/${docSpec.slug}`;

  // Add this doc to the result if it's a page (has content)
  if (!docSpec.children) {
    result.push({
      title: docSpec.label,
      description: "", // Will be populated from frontmatter later
      slug: docSpec.slug,
      path: docPath,
      type: "doc",
      product,
      hasExtractableSnippets: docSpec.hasExtractableSnippets || false,
    });
  }

  // Process children recursively
  if (docSpec.children && docSpec.children.length > 0) {
    docSpec.children.forEach((childSpec) => {
      const childItems = processDocSpec(childSpec, product, docPath);
      result.push(...childItems);
    });
  }

  return result;
}

/**
 * Get all docs metadata using the spec format
 * Processes the ProductDocsSpec and returns DocMeta items
 * @returns Array of DocMeta for all products and docs
 */
export function getDocsFromSpec(): DocMeta[] {
  const allDocs: DocMeta[] = [];

  // Process each product in the spec
  Object.entries(docsSpec).forEach(([product, productSpec]) => {
    // Process all sections
    productSpec.sections.forEach((section) => {
      // For the default section (index), don't add a section slug prefix
      const isDefaultSection = section.slug === "index";
      const sectionPathPrefix = isDefaultSection ? product : `${product}/${section.slug}`;

      // Process each document in this section
      section.children.forEach((docSpec) => {
        const docItems = processDocSpec(docSpec, product, sectionPathPrefix);
        allDocs.push(...docItems);
      });
    });
  });

  return allDocs;
}
