import type { DocMeta } from "@/lib/content/content-types";
import type { DocWithContent } from "@/lib/content/content-types";
import { DocumentNotFoundError } from "@/lib/content/errors";

// Import the DocContentHandler
import { docContentHandler } from "@/lib/content/handlers/doc-content-handler";

// Re-export DocMeta so other components can still import it from docs.ts
export type { DocMeta };

// Get document by path - proxies to the DocContentHandler
export const getDoc = async (path: string): Promise<DocWithContent> => {
  try {
    return await docContentHandler.getDocument(path);
  } catch (error) {
    console.error("[getDoc] Error fetching document:", error);

    // If it's already a DocumentNotFoundError, just throw it
    if (error instanceof DocumentNotFoundError) {
      throw error;
    }

    // Otherwise, convert to a DocumentNotFoundError
    throw new DocumentNotFoundError("doc", path);
  }
};

// For backward compatibility with components using the sync API
export const getDocsForProduct = (product: string): DocMeta[] => {
  return docContentHandler.getDocsForProduct(product);
};

// Get all docs for a product section - for backward compatibility
export const getDocsForSection = (product: string, section: string): DocMeta[] => {
  const allDocs = getDocsForProduct(product);
  return allDocs.filter((doc) => doc.section === section);
};

// Get all docs for a product group - for backward compatibility
export const getDocsForGroup = (product: string, group: string): DocMeta[] => {
  const allDocs = getDocsForProduct(product);
  return allDocs.filter((doc) => doc.group === group);
};

// Gets all available sections for a product
export const getSectionsForProduct = (product: string): { slug: string; title: string }[] => {
  return docContentHandler.getSectionsForProduct(product);
};
