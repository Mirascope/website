# Content System Design

This document outlines the architecture of the unified content system for handling docs, blog posts, and policy pages in the Mirascope website.

## System Overview

The content system provides a unified approach to loading, processing, and rendering various types of content with a cohesive, maintainable architecture. The architecture follows domain-driven design principles with content-type specific modules.

```mermaid
graph TD
    Component[React Component] --> ContentModules[Content Type Modules]
    ContentModules --> BlogModule[Blog Module]
    ContentModules --> DocModule[Doc Module]
    ContentModules --> PolicyModule[Policy Module]
    
    BlogModule --> useContent[useContent Hook]
    DocModule --> useContent
    PolicyModule --> useContent
    
    BlogModule --> BlogHandler[Blog Handler]
    DocModule --> DocHandler[Doc Handler]
    PolicyModule --> PolicyHandler[Policy Handler]
    
    DocHandler --> PathResolver[Path Resolver]
    DocHandler --> MetadataService[Metadata Service]
    DocHandler --> ContentLoader[Content Loader]
    DocHandler --> FrontmatterParser[Frontmatter Parser]
    BlogHandler --> PathResolver
    BlogHandler --> MetadataService
    BlogHandler --> ContentLoader
    BlogHandler --> FrontmatterParser
    PolicyHandler --> PathResolver
    PolicyHandler --> MetadataService
    PolicyHandler --> ContentLoader
    PolicyHandler --> FrontmatterParser
    
    ContentLoader --> ContentCache[Content Cache]
    MetadataService --> ContentTypes[Content Types]
    FrontmatterParser --> ContentTypes
    PathResolver --> ContentTypes
    BlogModule --> ErrorHandling[Error Types]
    DocModule --> ErrorHandling
    PolicyModule --> ErrorHandling
```

## File Structure & Key Interfaces

The system is organized into domain-specific modules with a shared infrastructure layer:

```
src/lib/content/
  ├── blog.ts                  # Blog-specific hooks and API
  ├── docs.ts                  # Docs-specific hooks and API
  ├── policy.ts                # Policy-specific hooks and API 
  ├── content-types.ts         # Core content type definitions
  ├── errors.ts                # Error type definitions
  ├── content-cache.ts         # Caching implementation
  ├── content-loader.ts        # Content loading logic
  ├── frontmatter.ts           # Frontmatter parsing
  ├── metadata-service.ts      # Metadata handling
  ├── path-resolver.ts         # Path normalization/resolution
  ├── hooks/                   # Base hook implementations
  │   ├── index.ts             # Re-exports
  │   └── useContent.ts        # Core content loading hook
  └── handlers/                # Content type handlers
      ├── base-content-handler.ts       # Base implementation
      ├── content-type-handler.ts       # Handler interface
      ├── blog-content-handler.ts       # Blog implementation
      ├── doc-content-handler.ts        # Doc implementation
      └── policy-content-handler.ts     # Policy implementation
```

Each module is organized according to its specific responsibility:

### `content-types.ts`

Defines the foundational types used throughout the content system.

```typescript
// Core content type enum
export type ContentType = 'doc' | 'blog' | 'policy';

// Base metadata interface
export interface ContentMeta {
  title: string;
  description?: string;
  path: string;
  slug: string;
  type: ContentType;
}

// Document with its metadata
export interface ContentWithMeta {
  meta: ContentMeta;
  content: string;
}

// Result of document validation
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

// Type-specific metadata extensions
export interface DocMeta extends ContentMeta {
  product: string;
  section?: string;
  group?: string;
  sectionTitle?: string;
  groupTitle?: string;
}

export interface BlogMeta extends ContentMeta {
  date: string;
  author: string;
  readTime: string;
  lastUpdated?: string;
}

export interface PolicyMeta extends ContentMeta {
  lastUpdated?: string;
}

// Type-specific document types
export type DocWithContent = ContentWithMeta & { meta: DocMeta };
export type BlogWithContent = ContentWithMeta & { meta: BlogMeta };
export type PolicyWithContent = ContentWithMeta & { meta: PolicyMeta };
```

### `errors.ts`

Defines custom error types for standardized error handling.

```typescript
export class ContentError extends Error {
  constructor(
    message: string,
    public contentType: ContentType,
    public path?: string
  ) {
    super(message);
    this.name = 'ContentError';
  }
}

export class DocumentNotFoundError extends ContentError {
  constructor(contentType: ContentType, path: string) {
    super(`${contentType} document not found: ${path}`, contentType, path);
    this.name = 'DocumentNotFoundError';
  }
}

export class InvalidPathError extends ContentError {
  constructor(contentType: ContentType, path: string) {
    super(`Invalid ${contentType} path: ${path}`, contentType, path);
    this.name = 'InvalidPathError';
  }
}

export class ContentLoadError extends ContentError {
  constructor(contentType: ContentType, path: string, cause?: Error) {
    super(
      `Failed to load ${contentType} content: ${path}${cause ? ` - ${cause.message}` : ''}`,
      contentType,
      path
    );
    this.name = 'ContentLoadError';
    this.cause = cause;
  }
}

export class MetadataError extends ContentError {
  constructor(contentType: ContentType, path: string, cause?: Error) {
    super(
      `Failed to process ${contentType} metadata: ${path}${cause ? ` - ${cause.message}` : ''}`,
      contentType,
      path
    );
    this.name = 'MetadataError';
    this.cause = cause;
  }
}
```

### `path-resolver.ts`

Handles path normalization and validation for different content types.

```typescript
export function normalizePath(path: string, contentType: ContentType): string {
  // Convert URL paths to file system paths
  // e.g., /docs/mirascope/getting-started -> mirascope/getting-started.mdx
}

export function buildFilePath(path: string, contentType: ContentType): string {
  // Convert normalized path to actual file path
  // e.g., mirascope/getting-started.mdx -> /src/docs/mirascope/getting-started.mdx
}

export function isValidPath(path: string, contentType: ContentType): boolean {
  // Validate that a path is well-formed for a content type
}

export function getStaticPath(path: string, contentType: ContentType): string {
  // Generate static file path for production
  // e.g., mirascope/getting-started.mdx -> /static/docs/mirascope/getting-started.json
}
```

### `frontmatter.ts`

Parses and extracts frontmatter from document content.

```typescript
export interface FrontmatterResult {
  frontmatter: Record<string, any>;
  content: string;
}

export function parseFrontmatter(content: string): FrontmatterResult {
  // Extract frontmatter from --- delimited sections
  // Return parsed frontmatter and clean content
}

export function validateFrontmatter(
  frontmatter: Record<string, any>,
  contentType: ContentType
): ValidationResult {
  // Validate that frontmatter has required fields for content type
}

export function mergeFrontmatter(
  target: Record<string, any>,
  source: Record<string, any>,
  overwrite = false
): Record<string, any> {
  // Combine frontmatter from multiple sources
}
```

### `content-cache.ts`

Provides unified caching for content to improve performance.

```typescript
export interface CacheEntry {
  content: string;
  timestamp: number;
  expires?: number;
}

export interface CacheOptions {
  maxSize?: number;
  defaultExpiration?: number;
  enabled?: boolean;
}

export class ContentCache {
  constructor(options?: CacheOptions);

  get(contentType: ContentType, key: string): string | null;
  
  set(contentType: ContentType, key: string, content: string, expiration?: number): void;
  
  invalidate(contentType?: ContentType, pattern?: string): void;
  
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
}

// Factory function
export function createContentCache(options?: CacheOptions): ContentCache;
```

### `metadata-service.ts`

Extracts and processes metadata from content and structure definitions.

```typescript
export function getMetadataFromStructure(
  path: string,
  contentType: ContentType
): ContentMeta {
  // Extract metadata from structure definitions (_meta.ts, etc.)
}

export function extractMetadataFromFrontmatter(
  frontmatter: Record<string, any>,
  contentType: ContentType,
  path: string
): Partial<ContentMeta> {
  // Convert frontmatter to typed metadata
}

export function mergeMetadata<T extends ContentMeta>(
  structureMeta: T,
  frontmatterMeta: Partial<T>
): T {
  // Merge metadata from multiple sources with proper precedence
}

export function validateMetadata(
  metadata: ContentMeta,
  contentType: ContentType
): ValidationResult {
  // Validate that metadata meets requirements for content type
}
```

### `content-loader.ts`

Handles loading content from different sources based on environment.

```typescript
export interface ContentLoaderOptions {
  cache?: ContentCache;
  devMode?: boolean;
}

export class ContentLoader {
  constructor(options?: ContentLoaderOptions);

  async loadContent(
    path: string,
    contentType: ContentType
  ): Promise<string>;
}

// Factory function
export function createContentLoader(options?: ContentLoaderOptions): ContentLoader;
```

### `handlers/content-type-handler.ts`

Defines the interface that each content type handler must implement, ensuring type safety and consistency.

```typescript
/**
 * Interface for type-specific content handlers
 */
export interface ContentTypeHandler<T extends ContentMeta> {
  /**
   * Retrieves a document by path
   */
  getDocument(path: string): Promise<ContentWithMeta & { meta: T }>;
  
  /**
   * Gets all documents of this content type
   */
  getAllDocuments(filter?: (meta: T) => boolean): Promise<T[]>;
  
  /**
   * Gets documents for a specific collection
   */
  getDocumentsForCollection(collection: string): Promise<T[]>;
}

/**
 * Type mapping from content types to their corresponding metadata types
 */
export type ContentTypeToMeta<T extends ContentType> = 
  T extends 'doc' ? DocMeta :
  T extends 'blog' ? BlogMeta :
  T extends 'policy' ? PolicyMeta :
  never;

/**
 * Map of content types to their handlers, ensuring all content types are covered
 */
export type ContentTypeHandlerMap = {
  [K in ContentType]: ContentTypeHandler<ContentTypeToMeta<K>>;
};
```

### `handlers/doc-content-handler.ts`

Implements the ContentTypeHandler interface for documentation.

```typescript
export class DocContentHandler implements ContentTypeHandler<DocMeta> {
  private loader: ContentLoader;
  private cache: ContentCache;

  constructor(loader: ContentLoader, cache?: ContentCache) {
    this.loader = loader;
    this.cache = cache || createContentCache();
  }

  async getDocument(path: string): Promise<ContentWithMeta & { meta: DocMeta }> {
    // Implementation that loads doc content with proper caching
  }

  async getAllDocuments(filter?: (meta: DocMeta) => boolean): Promise<DocMeta[]> {
    // Implementation that returns all docs
  }

  async getDocumentsForCollection(product: string): Promise<DocMeta[]> {
    // Implementation that returns docs for a specific product
  }

  // Doc-specific helper methods
  async getDocsForSection(product: string, section: string): Promise<DocMeta[]> { /*...*/ }
  async getDocsForGroup(product: string, group: string): Promise<DocMeta[]> { /*...*/ }
  getSectionsForProduct(product: string): { slug: string; title: string }[] { /*...*/ }
  getDocsForProduct(product: string): DocMeta[] { /*...*/ }
}

// Factory function
export function createDocContentHandler(): DocContentHandler { /*...*/ }

// Singleton instance
export const docContentHandler = createDocContentHandler();
```

### `handlers/blog-content-handler.ts`

Implements the ContentTypeHandler interface for blog posts.

```typescript
export class BlogContentHandler implements ContentTypeHandler<BlogMeta> {
  private loader: ContentLoader;
  private cache: ContentCache;

  constructor(loader: ContentLoader, cache?: ContentCache) {
    this.loader = loader;
    this.cache = cache || createContentCache();
  }

  async getDocument(path: string): Promise<ContentWithMeta & { meta: BlogMeta }> {
    // Implementation that loads blog content with proper caching
  }

  async getAllDocuments(filter?: (meta: BlogMeta) => boolean): Promise<BlogMeta[]> {
    // Implementation that returns all blog posts, sorted by date
  }

  async getDocumentsForCollection(collection: string): Promise<BlogMeta[]> {
    // Implementation that returns blog posts for a specific collection (tag, category, etc)
  }
}

// Factory function
export function createBlogContentHandler(): BlogContentHandler { /*...*/ }

// Singleton instance
export const blogContentHandler = createBlogContentHandler();
```

### `handlers/policy-content-handler.ts`

Implements the ContentTypeHandler interface for policy pages.

```typescript
export class PolicyContentHandler implements ContentTypeHandler<PolicyMeta> {
  private loader: ContentLoader;
  private cache: ContentCache;

  constructor(loader: ContentLoader, cache?: ContentCache) {
    this.loader = loader;
    this.cache = cache || createContentCache();
  }

  async getDocument(path: string): Promise<ContentWithMeta & { meta: PolicyMeta }> {
    // Implementation that loads policy content with proper caching
  }

  async getAllDocuments(filter?: (meta: PolicyMeta) => boolean): Promise<PolicyMeta[]> {
    // Implementation that returns all policy pages
  }

  async getDocumentsForCollection(collection: string): Promise<PolicyMeta[]> {
    // Implementation that returns policy pages for a specific collection (e.g., terms)
  }
}

// Factory function
export function createPolicyContentHandler(): PolicyContentHandler { /*...*/ }

// Singleton instance
export const policyContentHandler = createPolicyContentHandler();
```

### `blog.ts`, `docs.ts`, `policy.ts` - Domain Modules

These modules provide domain-specific APIs for each content type. They expose hooks for React components and functions for accessing content.

```typescript
// blog.ts example
import { blogContentHandler } from './handlers/blog-content-handler';
import { useContent } from './hooks/useContent';
import type { BlogMeta } from './content-types';
import type { ContentResult } from './hooks/useContent';

/**
 * Hook for loading and rendering a blog post
 */
export function useBlogPost(slug: string): ContentResult<BlogMeta> {
  return useContent<BlogMeta>(slug, blogContentHandler);
}

/**
 * Get a blog post by slug
 */
export function getBlogPost(slug: string) {
  return blogContentHandler.getDocument(slug);
}

/**
 * Get all blog posts
 */
export function getAllBlogPosts() {
  return blogContentHandler.getAllDocuments();
}
```

### `hooks/useContent.ts`

The base React hook for loading and processing content. This hook is used by the domain-specific modules.

```typescript
export interface Content<T extends ContentMeta = ContentMeta> {
  meta: T;
  rawContent: string;
  mdx: {
    code: string;
    frontmatter: Record<string, any>;
  } | null;
}

export interface ContentResult<T extends ContentMeta = ContentMeta> {
  content: Content<T> | null;
  loading: boolean;
  error: Error | null;
}

export function useContent<T extends ContentMeta>(
  path: string,
  handler: ContentTypeHandler<T>
): ContentResult<T> {
  // Implementation that loads content, processes MDX, and handles errors
}
```

## Data Flow

1. Component calls domain-specific hook (e.g. `useBlogPost(slug)`)
2. Domain hook calls the base `useContent` hook with the appropriate handler
3. The `useContent` hook:
   - Uses the provided handler to fetch content
   - Processes MDX content if available
   - Returns content with metadata and processed MDX
4. The handler:
   - Checks cache for content 
   - If not cached, loads content using `contentLoader`
   - Extracts frontmatter using `frontmatterParser`
   - Gets structure metadata using `metadataService`
   - Merges frontmatter and structure metadata
   - Returns complete document with metadata
5. Component renders the content, using the MDX renderer for the processed MDX

## Caching Strategy

The content cache is designed for optimal performance:

- **Cache Key**: `${contentType}:${specificKey}`
- **Cache Entry**: `{ content: string, timestamp: number, expires?: number }`
- **Expiration Policy**:
  - Development: 5 minutes by default (configurable)
  - Production: No expiration by default (configurable)
- **Eviction Policy**: LRU (Least Recently Used)
- **Size Limits**: Maximum 100 entries by default (configurable)
- **Cache Control**: Ability to invalidate by pattern matching

## Environment Handling

The system adapts to different environments:

- **Development**:
  - Content loaded via API
  - Short cache expiration to reflect changes
  - More verbose error reporting
  
- **Production**:
  - Pre-compiled static JSON files
  - Long-term caching
  - Streamlined error handling
  
- **Testing**:
  - Mock content for predictable tests
  - Ability to inject test content
  - Flexible configuration for different test scenarios

### Implementation Strategy for Environment Handling

- **Encapsulation**: Environment-specific logic is encapsulated within each service module
- **Unified API**: Services expose a consistent API regardless of environment
- **Internal Detection**: Modules detect the environment internally rather than requiring consumers to handle it
- **Configuration**: Environment-specific defaults are applied automatically, with the ability to override them
- **Abstraction**: Consumers should not need to know which environment they're in to use the services correctly

## Error Handling Philosophy

1. **Early Validation**: Validate inputs at the earliest possible point
2. **Specific Errors**: Use custom error types for different scenarios
3. **Graceful Fallbacks**: Provide sensible defaults when possible
4. **Comprehensive Information**: Include path, content type, and context in errors
5. **Developer Experience**: Detailed error messages in development

## Future Extensions

The system is designed to accommodate future enhancements:

1. **Server Components**: Support for React Server Components
2. **Static Site Generation**: Compatible with build-time data loading
3. **Internationalization**: Extensible for multi-language content
4. **Content Search**: Foundation for implementing search functionality
5. **Content API**: Potential to expose content through an API