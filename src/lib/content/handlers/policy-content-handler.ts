import type { PolicyMeta } from "@/lib/content/content-types";
import { ContentLoader } from "@/lib/content/content-loader";
import { ContentCache } from "@/lib/content/content-cache";
import { BaseContentHandler } from "./base-content-handler";
import { ContentError } from "@/lib/content/errors";

/**
 * Handler for policy content
 */
export class PolicyContentHandler extends BaseContentHandler<PolicyMeta> {
  /**
   * Creates a new PolicyContentHandler
   *
   * @param loader - Content loader instance
   * @param cache - Optional cache instance
   */
  constructor(loader?: ContentLoader, cache?: ContentCache) {
    super("policy", loader, cache);
  }

  /**
   * Creates metadata from frontmatter
   */
  protected createMetaFromFrontmatter(frontmatter: Record<string, any>, path: string): PolicyMeta {
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
   * Normalize policy paths
   */
  protected normalizePath(path: string): string {
    // Ensure policy paths start with a slash
    return path.startsWith("/") ? path : `/${path}`;
  }

  /**
   * Gets a cache key for policy documents
   */
  protected getCacheKey(path: string): string {
    return `policy:${path}`;
  }

  /**
   * Process content to clean up source mappings
   */
  protected processContent(content: string): string {
    return content.replace(/\/\/# sourceMappingURL=.*$/gm, "");
  }

  /**
   * Gets all policy documents
   */
  async getAllDocuments(filter?: (meta: PolicyMeta) => boolean): Promise<PolicyMeta[]> {
    try {
      // Check cache first
      const cacheKey = "all-policies";
      if (this.cache) {
        const cached = this.cache.get(this.contentType, cacheKey);
        if (cached) {
          const policies = JSON.parse(cached) as PolicyMeta[];
          return filter ? policies.filter(filter) : policies;
        }
      }

      // For policies, we have a known set of paths
      const policyPaths = ["privacy", "terms/service", "terms/use"];

      // Load each policy
      const policies: PolicyMeta[] = [];

      for (const path of policyPaths) {
        try {
          const doc = await this.getDocument(path);
          policies.push(doc.meta);
        } catch (error) {
          console.error(`Error loading policy at path ${path}:`, error);
          // Skip this policy and continue with others
        }
      }

      // Cache the results
      if (this.cache) {
        this.cache.set(this.contentType, cacheKey, JSON.stringify(policies));
      }

      // Apply filter if provided
      return filter ? policies.filter(filter) : policies;
    } catch (error) {
      throw new ContentError(
        `Failed to get all policy documents: ${error instanceof Error ? error.message : String(error)}`,
        this.contentType,
        undefined
      );
    }
  }

  /**
   * Gets policy documents for a specific collection
   * In this context, collection would be a category like "terms"
   */
  async getDocumentsForCollection(collection: string): Promise<PolicyMeta[]> {
    try {
      // Get all policies
      const allPolicies = await this.getAllDocuments();

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
}

/**
 * Factory function for creating a PolicyContentHandler
 */
export function createPolicyContentHandler(
  loader?: ContentLoader,
  cache?: ContentCache
): PolicyContentHandler {
  return new PolicyContentHandler(loader, cache);
}

// Create a default singleton instance that can be used throughout the application
export const policyContentHandler = createPolicyContentHandler();
