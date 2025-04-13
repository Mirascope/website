import type { ContentWithMeta, PolicyMeta } from "@/lib/content/content-types";
import type { ContentTypeHandler } from "@/lib/content/handlers/content-type-handler";
import { parseFrontmatter } from "@/lib/content/frontmatter";
import { isValidPath } from "@/lib/content/path-resolver";
import { extractMetadataFromFrontmatter, validateMetadata } from "@/lib/content/metadata-service";
import {
  ContentError,
  DocumentNotFoundError,
  InvalidPathError,
  MetadataError,
} from "@/lib/content/errors";
import { ContentLoader, createContentLoader } from "@/lib/content/content-loader";
import { ContentCache, createContentCache } from "@/lib/content/content-cache";

/**
 * Handler for policy content
 */
export class PolicyContentHandler implements ContentTypeHandler<PolicyMeta> {
  private loader: ContentLoader;
  private cache: ContentCache;

  /**
   * Creates a new PolicyContentHandler
   *
   * @param loader - Content loader instance
   * @param cache - Optional cache instance
   */
  constructor(loader: ContentLoader, cache?: ContentCache) {
    this.loader = loader;
    this.cache = cache || createContentCache();
  }

  /**
   * Retrieves a policy document by path
   */
  async getDocument(path: string): Promise<ContentWithMeta & { meta: PolicyMeta }> {
    try {
      // Check cache first if available
      const cacheKey = `policy:${path}`;
      if (this.cache) {
        const cached = this.cache.get("policy", cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Validate the path
      if (!isValidPath(path, "policy")) {
        throw new InvalidPathError("policy", path);
      }

      // Load the document content
      const rawContent = await this.loader.loadContent(path, "policy");

      // Parse frontmatter
      const { frontmatter, content } = parseFrontmatter(rawContent);

      // Extract metadata from frontmatter
      // Not using extractMetadataFromFrontmatter since we construct the meta object manually
      extractMetadataFromFrontmatter(frontmatter, "policy", path);

      // Create the meta object
      const meta: PolicyMeta = {
        title: frontmatter.title || "",
        path,
        slug: path.split("/").pop() || "",
        type: "policy",
        ...(frontmatter.lastUpdated && { lastUpdated: frontmatter.lastUpdated }),
        description: frontmatter.description || "",
      };

      // Validate the final metadata
      const validation = validateMetadata(meta, "policy");
      if (!validation.isValid) {
        throw new MetadataError(
          "policy",
          path,
          new Error(`Invalid metadata: ${validation.errors?.join(", ")}`)
        );
      }

      const result = { meta, content };

      // Cache the result
      if (this.cache) {
        this.cache.set("policy", cacheKey, JSON.stringify(result));
      }

      return result;
    } catch (error) {
      // Re-throw known errors
      if (
        error instanceof DocumentNotFoundError ||
        error instanceof InvalidPathError ||
        error instanceof MetadataError ||
        error instanceof ContentError
      ) {
        throw error;
      }

      // Wrap other errors
      throw new ContentError(`Failed to get policy document: ${path}`, "policy", path);
    }
  }

  /**
   * Gets all policy documents
   */
  async getAllDocuments(filter?: (meta: PolicyMeta) => boolean): Promise<PolicyMeta[]> {
    try {
      // Check cache first
      const cacheKey = "all-policies";
      if (this.cache) {
        const cached = this.cache.get("policy", cacheKey);
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
        this.cache.set("policy", cacheKey, JSON.stringify(policies));
      }

      // Apply filter if provided
      return filter ? policies.filter(filter) : policies;
    } catch (error) {
      throw new ContentError(
        `Failed to get all policy documents: ${error instanceof Error ? error.message : String(error)}`,
        "policy",
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
        "policy",
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
  return new PolicyContentHandler(
    loader || createContentLoader({ cache }),
    cache || createContentCache()
  );
}

// Create a default singleton instance that can be used throughout the application
export const policyContentHandler = createPolicyContentHandler();
