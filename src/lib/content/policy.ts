import { policyContentHandler } from "./handlers/policy-content-handler";
import { useContent } from "./hooks/useContent";
import type { PolicyMeta } from "./content-types";
import type { ContentResult, Content } from "./hooks/useContent";

// Define a PolicyContent type based on the Content interface
export type PolicyContent = Content<PolicyMeta>;

/**
 * Hook for loading and rendering a policy page
 */
export function usePolicy(path: string): ContentResult<PolicyMeta> {
  return useContent<PolicyMeta>(path, policyContentHandler);
}

/**
 * Get a policy by path
 */
export function getPolicy(path: string) {
  return policyContentHandler.getDocument(path);
}

/**
 * Get all policies
 */
export function getAllPolicies() {
  return policyContentHandler.getAllDocuments();
}

/**
 * Get policies in a specific collection
 */
export function getPoliciesInCollection(collection: string) {
  return policyContentHandler.getDocumentsForCollection(collection);
}

// Re-export policy types
export type { PolicyMeta };
