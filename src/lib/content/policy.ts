import { ContentLoader, createContentLoader } from "./content-loader";
import { ContentCache, createContentCache } from "./content-cache";
import { useContent } from "./useContent";
import { loadContent } from "./utils";
import type { ContentMeta, Content, ContentResult, GetContentFn, ContentHandler } from "./types";
import { ContentError } from "./errors";

// Define policy-specific metadata
export interface PolicyMeta extends ContentMeta {
  lastUpdated?: string;
}

// Define policy-specific content type
export type PolicyContent = Content<PolicyMeta>;

/**
 * Policy content handler implementation
 */
class PolicyHandler implements ContentHandler<PolicyMeta> {
  private loader: ContentLoader;
  private cache: ContentCache;
  private contentType: "policy" = "policy";

  constructor(loader?: ContentLoader, cache?: ContentCache) {
    this.loader = loader || createContentLoader({ cache });
    this.cache = cache || createContentCache();
  }

  /**
   * Get policy content by path
   */
  async getContent(path: string): Promise<PolicyContent> {
    // Normalize path to ensure it has the proper prefix
    const normalizedPath = this.normalizePath(path);

    return loadContent<PolicyMeta>(
      normalizedPath,
      this.contentType,
      this.loader,
      this.cache,
      this.createMeta,
      // Policy-specific content processing: clean up source mappings
      (content) => content.replace(/\/\/# sourceMappingURL=.*$/gm, "")
    );
  }

  /**
   * Get all policy metadata
   */
  async getAllMeta(): Promise<PolicyMeta[]> {
    try {
      // Check cache first
      const cacheKey = "all-policies";
      const cached = this.cache.get(this.contentType, cacheKey);
      if (cached) {
        return JSON.parse(cached) as PolicyMeta[];
      }

      // For policies, we have a known set of paths
      const policyPaths = ["privacy", "terms/service", "terms/use"];

      // Load each policy
      const policies: PolicyMeta[] = [];

      for (const path of policyPaths) {
        try {
          const policy = await this.getContent(path);
          policies.push(policy.meta);
        } catch (error) {
          console.error(`Error loading policy at path ${path}:`, error);
          // Skip this policy and continue with others
        }
      }

      // Cache the results
      this.cache.set(this.contentType, cacheKey, JSON.stringify(policies));

      return policies;
    } catch (error) {
      throw new ContentError(
        `Failed to get all policy documents: ${error instanceof Error ? error.message : String(error)}`,
        this.contentType,
        undefined
      );
    }
  }

  /**
   * Get policies in a specific collection
   */
  async getPoliciesInCollection(collection: string): Promise<PolicyMeta[]> {
    try {
      // Get all policies
      const allPolicies = await this.getAllMeta();

      // Filter by collection (e.g., "terms")
      return allPolicies.filter((policy) => {
        const pathParts = policy.path.split("/");
        return pathParts.length > 1 && pathParts[0] === collection;
      });
    } catch (error) {
      throw new ContentError(
        `Failed to get policy documents for collection ${collection}: ${error instanceof Error ? error.message : String(error)}`,
        this.contentType,
        undefined
      );
    }
  }

  /**
   * Normalize a policy path to ensure it has the proper prefix
   */
  private normalizePath(path: string): string {
    return path.startsWith("/") ? path : `/${path}`;
  }

  /**
   * Create metadata from frontmatter
   */
  private createMeta = (frontmatter: Record<string, any>, path: string): PolicyMeta => {
    return {
      title: frontmatter.title || "",
      path,
      slug: path.split("/").pop() || "",
      type: "policy",
      ...(frontmatter.lastUpdated && { lastUpdated: frontmatter.lastUpdated }),
      description: frontmatter.description || "",
    };
  };
}

// Create a singleton instance
const policyHandler = new PolicyHandler();

/**
 * Get policy content by path
 */
export const getPolicyContent: GetContentFn<PolicyMeta> = (
  path: string
): Promise<PolicyContent> => {
  return policyHandler.getContent(path);
};

/**
 * Hook for loading and rendering a policy page
 */
export function usePolicy(path: string): ContentResult<PolicyMeta> {
  return useContent<PolicyMeta>(path, getPolicyContent);
}

/**
 * Get a policy by path
 */
export function getPolicy(path: string): Promise<PolicyContent> {
  return policyHandler.getContent(path);
}

/**
 * Get all policy metadata
 */
export function getAllPolicyMeta(): Promise<PolicyMeta[]> {
  return policyHandler.getAllMeta();
}

/**
 * Get policies in a specific collection
 */
export function getPoliciesInCollection(collection: string): Promise<PolicyMeta[]> {
  return policyHandler.getPoliciesInCollection(collection);
}
