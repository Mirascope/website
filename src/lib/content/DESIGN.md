# Content System Design

This document outlines the architecture of the unified content system for handling docs, blog posts, and policy pages in the Mirascope website.

## System Overview

The content system provides a unified approach to loading, processing, and rendering various types of content with a cohesive, maintainable architecture. The architecture follows domain-driven design principles with content-type specific modules and a composition-based approach.

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
    
    BlogHandler --> ContentUtils[Content Utils]
    DocHandler --> ContentUtils
    PolicyHandler --> ContentUtils
    
    ContentUtils --> PathResolver[Path Resolver]
    ContentUtils --> MetadataService[Metadata Service]
    ContentUtils --> ContentLoader[Content Loader]
    ContentUtils --> FrontmatterParser[Frontmatter Parser]
    ContentUtils --> MDXProcessor[MDX Processor]
    
    ContentLoader --> ContentCache[Content Cache]
    MetadataService --> ContentTypes[Content Types]
    FrontmatterParser --> ContentTypes
    PathResolver --> ContentTypes
    ContentModules --> ErrorHandling[Error Types]
```

## File Structure & Key Components

The system is organized into domain-specific modules with a shared infrastructure layer:

```
src/lib/content/
  ├── blog.ts                  # Blog-specific hooks, types, and API
  ├── docs.ts                  # Docs-specific hooks, types, and API
  ├── policy.ts                # Policy-specific hooks, types, and API 
  ├── types.ts                 # Core shared type definitions
  ├── errors.ts                # Error type definitions
  ├── utils.ts                 # Shared utility functions
  ├── content-cache.ts         # Caching implementation
  ├── content-loader.ts        # Content loading logic
  ├── frontmatter.ts           # Frontmatter parsing
  ├── mdx-processor.ts         # MDX processing
  ├── metadata-service.ts      # Metadata handling
  ├── path-resolver.ts         # Path normalization/resolution
  └── useContent.ts            # Core content loading hook
```

Each module is focused on its specific responsibility:

### Domain-Specific Modules

The domain modules (blog.ts, docs.ts, policy.ts) contain:

1. Domain-specific metadata type definitions
2. Domain-specific content handler implementations
3. Public API hooks and functions for accessing content

Key characteristics:
- Each domain maintains its own metadata types that extend the base ContentMeta
- Each implements the ContentHandler interface using composition of utility functions
- Each provides typed hooks and functions for components to use

### Core Types (types.ts)

Defines the foundational types used throughout the content system.

```typescript
// Core content type enum
export type ContentType = "doc" | "blog" | "policy";

// Base metadata interface
export interface ContentMeta {
  title: string;
  description?: string;
  path: string;
  slug: string;
  type: ContentType;
}

// Base content interface with metadata plus content
export interface Content<T extends ContentMeta = ContentMeta> {
  meta: T;                         // Typed, validated metadata
  content: string;                 // Raw MDX with frontmatter stripped
  
  // MDX structure expected by components
  mdx: {
    code: string;
    frontmatter: Record<string, any>;
  };
}

// Result of validation
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
}

// Result type for content operations
export interface ContentResult<T extends ContentMeta = ContentMeta> {
  content: Content<T> | null;
  loading: boolean;
  error: Error | null;
}

// Interface for content handlers
export interface ContentHandler<T extends ContentMeta> {
  getContent(path: string): Promise<Content<T>>;
  getAllMeta(): Promise<T[]>;
}

// Type for content retrieval function
export type GetContentFn<T extends ContentMeta> = (path: string) => Promise<Content<T>>;

// Type for metadata retrieval function
export type GetMetaFn<T extends ContentMeta> = () => Promise<T[]>;
```

### Utilities (utils.ts)

Provides shared utility functions for all domain modules.

```typescript
/**
 * Creates a cache key for content
 */
export function createCacheKey(contentType: ContentType, path: string): string;

/**
 * Load content by path with caching
 */
export async function loadContent<T extends ContentMeta>(
  path: string,
  contentType: ContentType,
  loader: ContentLoader,
  cache: ContentCache,
  createMeta: (frontmatter: Record<string, any>, path: string) => T,
  postprocessContent?: (content: string) => string
): Promise<Content<T>>;
```

### Content Hook (useContent.ts)

The base React hook for loading and processing content.

```typescript
/**
 * Base hook for loading and processing content
 */
export function useContent<T extends ContentMeta>(
  path: string,
  getContent: GetContentFn<T>
): ContentResult<T>;
```

### Domain Implementations

Each domain implements its handler using composition:

```typescript
// Example from blog.ts
export interface BlogMeta extends ContentMeta {
  date: string;
  author: string;
  readTime: string;
  lastUpdated?: string;
}

export type BlogContent = Content<BlogMeta>;

class BlogHandler implements ContentHandler<BlogMeta> {
  private loader: ContentLoader;
  private cache: ContentCache;
  private contentType: "blog" = "blog";

  constructor(loader?: ContentLoader, cache?: ContentCache) {
    this.loader = loader || createContentLoader({ cache });
    this.cache = cache || createContentCache();
  }

  async getContent(slug: string): Promise<BlogContent> {
    const normalizedSlug = this.normalizePath(slug);
    return loadContent<BlogMeta>(
      normalizedSlug,
      this.contentType,
      this.loader,
      this.cache,
      this.createMeta
    );
  }

  async getAllMeta(): Promise<BlogMeta[]> {
    // Implementation that returns all blog posts metadata
  }

  // Private helper methods
  private normalizePath(slug: string): string;
  private createMeta(frontmatter: Record<string, any>, path: string): BlogMeta;
  private getPostsList(): Promise<BlogMeta[]>;
}

// Public API
export const getBlogContent: GetContentFn<BlogMeta> = (slug: string): Promise<BlogContent>;
export function useBlogPost(slug: string): ContentResult<BlogMeta>;
export function getAllBlogMeta(): Promise<BlogMeta[]>;
```

## Data Flow

1. Component calls domain-specific hook (e.g. `useBlogPost(slug)`)
2. Hook calls `useContent` with the domain's `getContent` function
3. The `useContent` hook:
   - Manages loading state and error handling
   - Calls the provided `getContent` function
   - Returns the result with appropriate loading/error states
4. The domain's `getContent` function:
   - Calls the shared `loadContent` utility
   - Passes domain-specific methods for metadata creation and content processing
5. The `loadContent` utility:
   - Checks the cache
   - Loads raw content via the ContentLoader
   - Extracts frontmatter
   - Creates metadata using the domain-specific function
   - Processes MDX content
   - Returns the complete Content object
6. Component renders the content, using the MDX renderer with the processed code

## Caching Strategy

The content cache is designed for optimal performance:

- Each handler maintains its own cache instance
- Cache keys are domain-specific for better isolation
- Both metadata and content are cached
- Development mode uses shorter cache times
- Production uses pre-generated content with longer cache times

## MDX Processing

Content goes through a multi-step processing pipeline:

1. Raw content is loaded from the source
2. Frontmatter is extracted and parsed
3. Domain-specific pre-processing is applied if needed
4. MDX content is processed using next-mdx-remote/serialize
5. Processed content is stored with metadata for rendering

## Error Handling Philosophy

1. **Specific Errors**: Custom error types for different scenarios
2. **Graceful Recovery**: Components handle error states appropriately
3. **Detailed Information**: Errors include path, content type, and context
4. **Proper State Management**: Loading and error states are clearly represented

## Design Principles

1. **Domain-Driven Design**: Each content type has its own module with specific logic
2. **Composition over Inheritance**: Handlers use shared utilities rather than inheritance
3. **Separation of Concerns**: Clear responsibilities for each module
4. **Type Safety**: Full TypeScript type coverage for improved reliability
5. **Performance Focus**: Efficient caching and processing

## Future Extensions

The system is designed to accommodate future enhancements:

1. **Content Search**: Foundation for implementing search functionality
2. **Static Site Generation**: Compatible with build-time data loading
3. **Internationalization**: Extensible for multi-language content
4. **Enhanced MDX Processing**: Support for more advanced MDX features
5. **Server Components**: Support for React Server Components