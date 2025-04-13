import { processMDX } from "./mdx-utils";
import { DocumentNotFoundError } from "./content/errors";
// Import but use ContentPolicyMeta internally via the handler
import "@/lib/content/content-types";
import { policyContentHandler } from "@/lib/content/handlers/policy-content-handler";

/**
 * PolicyMeta - Type for policy/terms metadata from frontmatter
 * (For backward compatibility with existing components)
 */
export interface PolicyMeta {
  title: string;
  lastUpdated?: string;
}

/**
 * Fetch and process a policy or terms MDX file
 */
export const fetchPolicyContent = async (
  path: string
): Promise<{
  meta: PolicyMeta;
  content: string;
  compiledMDX: { code: string; frontmatter: Record<string, any> };
}> => {
  try {
    console.log(`[policy-utils] Fetching policy content for: ${path}`);

    // Use the PolicyContentHandler to get the document
    const policyDocument = await policyContentHandler.getDocument(path);

    // Create meta object from the returned metadata
    // Convert from ContentPolicyMeta to PolicyMeta for backward compatibility
    const meta: PolicyMeta = {
      title: policyDocument.meta.title,
      lastUpdated: policyDocument.meta.lastUpdated,
    };

    // Process the MDX content
    const compiledMDX = await processMDX(policyDocument.content);

    return {
      meta,
      content: policyDocument.content,
      compiledMDX,
    };
  } catch (error) {
    console.error(`Error loading policy content from ${path}:`, error);

    // If it's already a DocumentNotFoundError, just re-throw it
    if (error instanceof DocumentNotFoundError) {
      throw error;
    }

    // Otherwise, throw a generic error
    throw new Error(`Failed to load policy content from ${path}`);
  }
};

/**
 * Get all policy documents
 */
export const getAllPolicies = async (): Promise<PolicyMeta[]> => {
  try {
    const allPolicies = await policyContentHandler.getAllDocuments();

    // Convert to PolicyMeta for backward compatibility
    return allPolicies.map((policy) => ({
      title: policy.title,
      lastUpdated: policy.lastUpdated,
    }));
  } catch (error) {
    console.error("Error loading all policies:", error);
    throw error;
  }
};

/**
 * Get policy documents in a specific collection (e.g., "terms")
 */
export const getPoliciesInCollection = async (collection: string): Promise<PolicyMeta[]> => {
  try {
    const policies = await policyContentHandler.getDocumentsForCollection(collection);

    // Convert to PolicyMeta for backward compatibility
    return policies.map((policy) => ({
      title: policy.title,
      lastUpdated: policy.lastUpdated,
    }));
  } catch (error) {
    console.error(`Error loading policies in collection ${collection}:`, error);
    throw error;
  }
};

/**
 * Format a date string to "Month Day, Year" format
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  try {
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/Los_Angeles",
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString;
  }
};
