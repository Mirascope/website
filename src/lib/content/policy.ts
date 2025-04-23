import { loadContent } from "./content-loader";
import type { PolicyMeta, PolicyContent } from "./content-types";
import { ContentError } from "./errors";

// Re-export type definitions
export type { PolicyMeta, PolicyContent };

// Define known policy paths
const KNOWN_POLICY_PATHS = ["privacy", "terms/service", "terms/use"];

/**
 * Create metadata from frontmatter for policies
 */
function createPolicyMeta(frontmatter: Record<string, any>, path: string): PolicyMeta {
  return {
    title: frontmatter.title || "",
    path,
    slug: path.split("/").pop() || "",
    type: "policy",
    ...(frontmatter.lastUpdated && { lastUpdated: frontmatter.lastUpdated }),
    description: frontmatter.description || "",
  };
}

/**
 * Clean up source mappings in policy content
 */
function cleanupPolicyContent(content: string): string {
  return content.replace(/\/\/# sourceMappingURL=.*$/gm, "");
}

/**
 * Get policy content by path
 */
export async function getPolicy(path: string): Promise<PolicyContent> {
  return loadContent<PolicyMeta>(path, "policy", createPolicyMeta, {
    preprocessContent: cleanupPolicyContent,
  });
}

/**
 * Get all policy metadata
 */
export async function getAllPolicyMeta(): Promise<PolicyMeta[]> {
  try {
    // For policies, we have a known set of paths
    const policies: PolicyMeta[] = [];

    for (const path of KNOWN_POLICY_PATHS) {
      try {
        const policy = await getPolicy(path);
        policies.push(policy.meta);
      } catch (error) {
        console.error(`Error loading policy at path ${path}:`, error);
        // Skip this policy and continue with others
      }
    }

    return policies;
  } catch (error) {
    throw new ContentError(
      `Failed to get all policy documents: ${error instanceof Error ? error.message : String(error)}`,
      "policy",
      undefined
    );
  }
}

/**
 * Get policies in a specific collection
 */
export async function getPoliciesInCollection(collection: string): Promise<PolicyMeta[]> {
  try {
    // Get all policies
    const allPolicies = await getAllPolicyMeta();

    // Filter by collection (e.g., "terms")
    return allPolicies.filter((policy) => {
      const pathParts = policy.path.split("/");
      return pathParts.length > 1 && pathParts[0] === collection;
    });
  } catch (error) {
    throw new ContentError(
      `Failed to get policy documents for collection ${collection}: ${error instanceof Error ? error.message : String(error)}`,
      "policy",
      undefined
    );
  }
}

/**
 * Creates a loader function for a policy page
 * This makes it easy to inline policy loaders in route files
 */
export function createPolicyLoader(policyPath: string) {
  return async () => {
    try {
      return await getPolicy(policyPath);
    } catch (error) {
      console.error(`Error loading policy: ${policyPath}`, error);
      throw error;
    }
  };
}
