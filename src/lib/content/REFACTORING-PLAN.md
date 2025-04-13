# Content System Refactoring Plan

This document outlines a step-by-step plan for implementing the unified content system described in DESIGN.md and migrating the existing content handling code to use the new system.

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

#### Step 10: Blog Content Handler (IN PROGRESS)

**Status**: Not started

**Changes:**
- Create `blog-content-handler.ts` for blog-specific handling
- Migrate blog post retrieval logic from `mdx.ts`
- Add proper caching, error handling, and type safety
- Update `mdx.ts` to use the new handler
- Maintain backward compatibility with existing components

#### Step 11: Policy Content Handler

**Status**: Not started

**Changes:**
- Create `policy-content-handler.ts` for policy-specific handling
- Migrate policy page retrieval logic from `policy-utils.ts`
- Add proper caching, error handling, and type safety
- Update `policy-utils.ts` to use the new handler
- Maintain backward compatibility with existing components

### Phase 4: Document Service

#### Step 12: Document Service

**Status**: Not started

**Changes:**
- Implement `document-service.ts` as main entry point
- Wire together the previous components
- Add integration tests

#### Step 13: React Hooks

**Status**: Not started

**Changes:**
- Implement React hooks for document loading
- Add component tests

### Phase 5: Migration

#### Step 14: Migrate Components

**Status**: Not started

**Changes:**
- Update components to use new hooks instead of direct imports
- Fix the "Untitled Document" issue through proper error handling
- Add tests for component behavior

#### Step 15: Remove Legacy Code

**Status**: Not started

**Changes:**
- Remove old content handling code
- Create utility modules for shared logic
- Final tests to ensure everything works

## Progress Summary

- ✅ Phases 1 and 2 are complete (Foundation and Core Services)
- ✅ Started Phase 3 with the Content Type Handler interface and Doc Content Handler
- 🔜 Next up are Blog Content Handler and Policy Content Handler
- 🔜 Then Document Service and React Hooks
- 🔜 Finally, component migration and cleanup