import type { ContentType, ContentMeta, Content, ValidationResult } from "./types";
import { validateMetadata as validateMetadataService } from "./metadata-service";
import { processMDXContent } from "./mdx-processor";
import { fetchRawContent } from "./content-loader";
import type { ContentLoaderOptions } from "./content-loader";
import { resolveContentPath, isValidPath } from "./path-resolver";
import { handleContentError, InvalidPathError } from "./errors";
import { environment } from "./environment";

/**
 * Enhanced validation that uses the metadata service but provides a simpler interface
 */
function validateContentMetadata<T extends ContentMeta>(meta: T, contentType: ContentType): void {
  // Use the metadata service for validation
  const validation: ValidationResult = validateMetadataService(meta, contentType);

  // Handle validation failures
  if (!validation.isValid) {
    throw new Error(`Invalid metadata: ${validation.errors?.join(", ")}`);
  }
}

/**
 * Unified content loading pipeline that handles the entire process
 * from path resolution to MDX processing and metadata creation
 */
export async function loadContent<T extends ContentMeta>(
  path: string,
  contentType: ContentType,
  createMeta: (frontmatter: Record<string, any>, path: string) => T,
  options?: ContentLoaderOptions & {
    preprocessContent?: (content: string) => string;
  }
): Promise<Content<T>> {
  try {
    // Validate the path
    if (!isValidPath(path, contentType)) {
      throw new InvalidPathError(contentType, path);
    }

    // Get environment info
    const devMode = options?.devMode ?? environment.isDev();

    // Get content path
    const contentPath = resolveContentPath(path, contentType, { devMode });

    // Use fetch to get raw content
    const rawContent = await fetchRawContent(contentPath, devMode);

    // Process MDX with preprocessing if needed
    const processed = await processMDXContent(rawContent, {
      preprocessContent: options?.preprocessContent,
    });

    // Create metadata
    const meta = createMeta(processed.frontmatter, path);

    // Validate metadata
    try {
      validateContentMetadata(meta, contentType);
    } catch (error) {
      handleContentError(error, contentType, path);
    }

    // Return complete content
    return {
      meta,
      content: processed.content,
      mdx: {
        code: processed.code,
        frontmatter: processed.frontmatter,
      },
    };
  } catch (error) {
    return handleContentError(error, contentType, path);
  }
}
