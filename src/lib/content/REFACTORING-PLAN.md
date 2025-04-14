# Content System Refactoring Plan

This document outlines the plan for implementing the unified content system described in DESIGN.md and migrating the existing content handling code to use the new system.

## Current Pain Points

1. **"Untitled Document" Issue**: When users navigate to an invalid path like `/docs/mirascope/getting-started/foo`, they see a document titled "Untitled Document" instead of a proper error. This happens because:
   - `getMetadataFromStructure` in `docs.ts` returns a placeholder document with "Untitled Document" as title.
   - The error isn't properly propagated to the component.

2. **Duplicated Logic**: Content handling is duplicated across several files:
   - `docs.ts` - Documentation handling (686 lines)
   - `mdx.ts` - Blog post handling (196 lines)
   - `policy-utils.ts` - Policy page handling

3. **Inconsistent Error Handling**: Each content type handles errors differently:
   - Some return fallback content
   - Some throw errors
   - Some show placeholder content

4. **Path Handling Complexity**: Complex, hard-to-follow path handling logic with many edge cases.

5. **Isolated Caching**: Each content type has its own caching mechanism without proper invalidation.

## New Architecture

We've re-designed the content system with a domain-driven approach:

1. **Domain-Specific Modules**: Each content type has its own module:
   - `blog.ts` - For blog-specific functionality
   - `docs.ts` - For docs-specific functionality
   - `policy.ts` - For policy-specific functionality

2. **Clean Component APIs**: Components import directly from their domain module:
   ```typescript
   import { useBlogPost } from '@/lib/content/blog';
   import { useDoc } from '@/lib/content/docs';
   import { usePolicy } from '@/lib/content/policy';
   ```

3. **Unified Infrastructure**: Shared foundational layers for all content types:
   - Content handlers for fetching content
   - Unified caching, path resolution, and metadata handling
   - Base hook implementation in `useContent`

## Key Assumptions

1. **File Structure**:
   - Documentation: `/src/docs/{product}/{path}.mdx`
   - Blog posts: `/src/posts/{slug}.mdx`
   - Policies: `/src/policies/{path}.mdx`

2. **Metadata Structure**:
   - Docs use a combination of `_meta.ts` and frontmatter
   - Blog posts primarily use frontmatter
   - Policy pages primarily use frontmatter

3. **API Interfaces**:
   - Components expect: `{ meta, content }` structure
   - Frontmatter is expected to have `title`, `description`, etc.

4. **Environment Handling**:
   - Development: Files loaded via API (`docsAPI.getDocContent`, `mockAPI.getPostContent`)
   - Production: Pre-generated JSON files (`/static/docs/...`, `/static/posts/...`)

## Approach

- Implement core modules incrementally
- Integrate improvements as we go rather than waiting until the end
- Maintain a working application at each step
- Add tests for each new component
- Encapsulate environment-specific logic within each module
  - Use unified APIs that handle both development and production environments
  - Avoid leaking environment checks into consuming components

## Implementation Plan

### Phase 1: Foundation

#### ✅ Step 1: Directory Structure and Content Types (COMPLETED)

**Status**: Completed

**Changes:**
- ✅ Created `src/lib/content/` directory
- ✅ Implemented `content-types.ts` with basic type definitions
- ✅ Added unit tests for content types

### Phase 2: Core Services

#### ✅ Step 2: Error Types (COMPLETED)

**Status**: Completed

**Changes:**
- ✅ Implemented `errors.ts` with error classes
- ✅ Added tests for error handling

#### ✅ Step 3: Frontmatter Parser (COMPLETED)

**Status**: Completed

**Changes:**
- ✅ Extracted and improved frontmatter parsing from existing code
- ✅ Created unified parser in `frontmatter.ts`
- ✅ Added comprehensive tests
- ✅ Updated all existing code to use the new parser

#### ✅ Step 4: Path Resolver (COMPLETED)

**Status**: Completed

**Changes:**
- ✅ Implemented `path-resolver.ts` for path normalization 
- ✅ Created functions for different path operations
- ✅ Added comprehensive tests for all path formats

#### ✅ Step 5: Cache Implementation (COMPLETED)

**Status**: Completed

**Changes:**
- ✅ Implemented `content-cache.ts` with unified caching
- ✅ Added tests for cache operations
- ✅ Implemented environment-specific caching strategies
- ✅ Integrated with existing code in docs.ts and mdx.ts

#### ✅ Step 6: Metadata Service (COMPLETED)

**Status**: Completed

**Changes:**
- ✅ Implemented `metadata-service.ts` for handling metadata
- ✅ Extracted metadata handling from existing code
- ✅ Added tests for metadata operations

#### ✅ Step 7: Content Loader (COMPLETED)

**Status**: Completed

**Changes:**
- ✅ Implemented `content-loader.ts` with unified content loading
- ✅ Extracted content loading from existing code
- ✅ Added comprehensive tests for dev/prod environments and error handling
- ✅ Integrated with existing code

### Phase 3: Content Handlers

#### ✅ Step 8: Content Type Handler Interface (COMPLETED)

**Status**: Completed

**Changes:**
- ✅ Created `content-type-handler.ts` interface for type-specific content handlers
- ✅ Defined mapping from content types to metadata types
- ✅ Ensured exhaustive mapping with TypeScript
- ✅ Added documentation and type safety

#### ✅ Step 9: Doc Content Handler (COMPLETED)

**Status**: Completed

**Changes:**
- ✅ Implemented `doc-content-handler.ts` for doc-specific handling
- ✅ Migrated doc retrieval logic from `docs.ts`
- ✅ Added proper caching, error handling, and type safety
- ✅ Updated `docs.ts` to use the new handler
- ✅ Maintained backward compatibility with existing components

#### ✅ Step 10: Blog Content Handler (COMPLETED)

**Status**: Completed

**Changes:**
- ✅ Created `blog-content-handler.ts` for blog-specific handling
- ✅ Migrated blog post retrieval logic from `mdx.ts`
- ✅ Added proper caching, error handling, and type safety
- ✅ Updated `mdx.ts` to use the new handler
- ✅ Maintained backward compatibility with existing components

#### ✅ Step 11: Policy Content Handler (COMPLETED)

**Status**: Completed

**Changes:**
- ✅ Created `policy-content-handler.ts` for policy-specific handling
- ✅ Migrated policy page retrieval logic from `policy-utils.ts`
- ✅ Added proper caching, error handling, and type safety
- ✅ Updated `policy-utils.ts` to use the new handler
- ✅ Maintained backward compatibility with existing components

### Phase 4: Domain-Specific APIs

#### ✅ Step 12: Base Content Hook

**Status**: Completed

**Changes:**
- ✅ Implemented `useContent` base hook
- ✅ Domain-driven approach instead of document service
- ✅ Added integration with MDX processing

#### ✅ Step 13: Domain Modules

**Status**: Completed

**Changes:**
- ✅ Created domain-specific modules:
  - `blog.ts` - Blog-specific hooks and functions
  - `docs.ts` - Doc-specific hooks and functions
  - `policy.ts` - Policy-specific hooks and functions
- ✅ Type-safe APIs for components

### Phase 5: Migration

#### ✅ Step 14: Migrate Blog Components

**Status**: Completed

**Changes:**
- ✅ Updated BlogPostPage to use `useBlogPost` from `blog.ts`
- ✅ Updated BlogIndex to use `getAllBlogPosts` from `blog.ts`
- ✅ Proper error handling without "Untitled Document" placeholders

#### ✅ Step 15: Migrate Doc Components

**Status**: Completed

**Changes:**
- ✅ Updated doc components to use `useDoc` and other functions from `docs.ts`
- ✅ Fixed the "Untitled Document" issue through proper error handling
- ✅ Implemented clean error states for non-existent paths

#### ✅ Step 16: Migrate Policy Components

**Status**: Completed

**Changes:**
- ✅ Updated policy components to use `usePolicy` from `policy.ts`
- ✅ Ensured consistent error handling across content types

#### ✅ Step 17: Remove Legacy Code

**Status**: Completed

**Changes:**
- ✅ Removed old content handling code:
  - `docs.ts` in lib/
  - `mdx.ts` in lib/
  - `policy-utils.ts` in lib/
  - `mdx-static.ts` in lib/
  - Legacy hooks (`useMDXProcessor.ts`, `usePolicy.ts`)
- ✅ Fixed all type errors and ensured clean interfaces
- ✅ Verified all linting checks pass

## Progress Summary

- ✅ Phases 1, 2, and 3 are complete (Foundation, Core Services, Content Type Handlers)
- ✅ Phase 4 is complete (Domain-Specific APIs)
- ✅ Phase 5 is complete (Migration)
  - ✅ Step 14: Blog Component Migration
  - ✅ Step 15: Doc Component Migration
  - ✅ Step 16: Policy Component Migration
  - ✅ Step 17: Legacy Code Removal

🎉 **Refactoring Complete!** All components are now using the new domain-driven content system.