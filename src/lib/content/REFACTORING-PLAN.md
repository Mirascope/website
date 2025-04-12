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

## Implementation Plan

### Phase 1: Foundation

#### Step 1: Directory Structure and Content Types

**Changes:**
- Create `src/lib/content/` directory
- Implement `content-types.ts` with basic type definitions
- Add unit tests for content types

**Tests:**
- Type validation
- Type extension

**Files:**
- `src/lib/content/content-types.ts`
- `src/lib/content/tests/content-types.test.ts`

**Current Dependencies:**
- None

**Expected Usage:**
```typescript
import { ContentType, ContentMeta, DocMeta } from '@/lib/content/content-types';

// Example usage
const docType: ContentType = 'doc';
const meta: DocMeta = {
  title: 'Document Title',
  description: 'Description',
  path: 'mirascope/getting-started',
  slug: 'getting-started',
  type: 'doc',
  product: 'mirascope'
};
```

#### Step 2: Error Types

**Changes:**
- Implement `errors.ts` with error classes
- Add tests for error handling

**Tests:**
- Error instantiation
- Error inheritance
- Error serialization

**Files:**
- `src/lib/content/errors.ts`
- `src/lib/content/tests/errors.test.ts`

**Current Dependencies:**
- `ContentType` from `content-types.ts`

**Expected Usage:**
```typescript
import { DocumentNotFoundError } from '@/lib/content/errors';

// In error handling
try {
  // ...
} catch (error) {
  if (error instanceof DocumentNotFoundError) {
    // Handle doc not found
  } else {
    // Handle other errors
  }
}
```

#### Step 3: Frontmatter Parser

**Changes:**
- Extract and improve frontmatter parsing from existing code
- Create unified parser in `frontmatter.ts`
- Add comprehensive tests

**Tests:**
- Parse valid frontmatter
- Handle invalid frontmatter
- Extract content correctly
- Handle edge cases

**Files:**
- `src/lib/content/frontmatter.ts`
- `src/lib/content/tests/frontmatter.test.ts`

**Current Dependencies:**
- Existing frontmatter parsing in `docs.ts` (lines 38-92) and `mdx.ts` (lines 25-56)

**Existing Logic:**
- Both implementations use a regex-based approach to extract frontmatter between `---` delimiters
- Both parse key-value pairs from the frontmatter section
- Both handle quote stripping from values

**Expected Usage:**
```typescript
import { parseFrontmatter } from '@/lib/content/frontmatter';

const content = `---
title: My Document
description: This is a description
---

# My Document

Content here...`;

const { frontmatter, content: cleanContent } = parseFrontmatter(content);
// frontmatter = { title: 'My Document', description: 'This is a description' }
// cleanContent = '# My Document\n\nContent here...'
```

**Integration:**
- Update `parseFrontmatter` in `docs.ts` to use the new implementation
- Update `parseFrontmatter` in `mdx.ts` to use the new implementation

### Phase 2: Core Services

#### Step 4: Path Resolver

**Changes:**
- Implement `path-resolver.ts` for path normalization 
- Extract path handling from existing code
- Add tests for all path formats

**Tests:**
- Normalize different path formats
- Handle invalid paths
- Generate file paths

**Files:**
- `src/lib/content/path-resolver.ts`
- `src/lib/content/tests/path-resolver.test.ts`

**Current Dependencies:**
- Path handling in `docs.ts` (lines 97-136)

**Existing Logic:**
- Complex handling for trailing slashes, index paths, etc.
- Examples:
  - `/docs/mirascope/getting-started` → `mirascope/getting-started.mdx`
  - `/docs/mirascope/getting-started/` → `mirascope/getting-started/index.mdx`

**Expected Usage:**
```typescript
import { normalizePath, buildFilePath } from '@/lib/content/path-resolver';

const path = '/docs/mirascope/getting-started';
const normalized = normalizePath(path, 'doc'); // 'mirascope/getting-started.mdx'
const filePath = buildFilePath(normalized, 'doc'); // '/src/docs/mirascope/getting-started.mdx'
```

**Integration:**
- Update path handling in `getDoc` function in `docs.ts`

#### Step 5: Cache Implementation

**Changes:**
- Implement `content-cache.ts` with unified caching
- Add tests for cache operations

**Tests:**
- Cache items
- Retrieve cached items
- Handle expiration
- Test LRU behavior

**Files:**
- `src/lib/content/content-cache.ts`
- `src/lib/content/tests/content-cache.test.ts`

**Current Dependencies:**
- Existing caches: `contentCache` in `docs.ts` (line 35), `postsCache` and `postListCache` in `mdx.ts` (lines 21-22)

**Existing Logic:**
- Simple object-based caching without expiration
- No size limits or LRU eviction

**Expected Usage:**
```typescript
import { createContentCache } from '@/lib/content/content-cache';

const cache = createContentCache({ maxSize: 100, defaultExpiration: 5 * 60 * 1000 });
cache.set('doc:mirascope/getting-started.mdx', 'content');
const entry = cache.get('doc:mirascope/getting-started.mdx');
```

#### Step 6: Metadata Service

**Changes:**
- Implement `metadata-service.ts` for handling metadata
- Extract metadata handling from existing code
- Add tests for metadata operations

**Tests:**
- Get metadata from structure
- Extract metadata from frontmatter
- Merge metadata
- Validate metadata

**Files:**
- `src/lib/content/metadata-service.ts`
- `src/lib/content/tests/metadata-service.test.ts`

**Current Dependencies:**
- Metadata handling in `docs.ts` (lines 276-571)
- Existing `docsMetadata` import from `../docs/_meta`

**Existing Logic:**
- Complex metadata extraction from `_meta.ts`
- Path-based inference of document type, section, group, etc.
- Fallback title generation
- Untitled Document generation for invalid paths

**Expected Usage:**
```typescript
import { getMetadataFromStructure, mergeMetadata } from '@/lib/content/metadata-service';

const structureMeta = getMetadataFromStructure('mirascope/getting-started', 'doc');
const frontmatterMeta = { title: 'Custom Title', description: 'Custom Description' };
const finalMeta = mergeMetadata(structureMeta, frontmatterMeta);
```

#### Step 7: Content Loader

**Changes:**
- Implement `content-loader.ts` for loading content
- Extract content loading from existing code
- Add tests for various content sources

**Tests:**
- Load content in development
- Load content in production
- Handle errors
- Use cache

**Files:**
- `src/lib/content/content-loader.ts`
- `src/lib/content/tests/content-loader.test.ts`

**Current Dependencies:**
- Content loading in `docs.ts` (lines 147-237)
- Content loading in `mdx.ts` (lines 147-180)
- APIs: `docsAPI.getDocContent` and `mockAPI.getPostContent`

**Existing Logic:**
- Environment-specific loading (dev vs. prod)
- Different APIs for different content types
- Error handling with fallback content
- Cache usage

**Expected Usage:**
```typescript
import { createContentLoader } from '@/lib/content/content-loader';
import { createContentCache } from '@/lib/content/content-cache';

const cache = createContentCache();
const loader = createContentLoader({ cache, devMode: true });
const content = await loader.loadContent('mirascope/getting-started.mdx', 'doc');
```

### Phase 3: Integration

#### Step 8: Document Service

**Changes:**
- Implement `document-service.ts` as main entry point
- Wire together the previous components
- Add integration tests

**Tests:**
- End-to-end document loading
- Collection handling
- Error propagation

**Files:**
- `src/lib/content/document-service.ts`
- `src/lib/content/tests/document-service.test.ts`

**Current Dependencies:**
- All previous components
- Existing document loading functions:
  - `getDoc` in `docs.ts` (lines 95-274)
  - `getPostBySlug` in `mdx.ts` (lines 193)
  - Similar function in `policy-utils.ts`

**Expected Usage:**
```typescript
import { createDocumentService } from '@/lib/content/document-service';

const documentService = createDocumentService();
const document = await documentService.getDocument('/docs/mirascope/getting-started', 'doc');
```

#### Step 9: React Hooks

**Changes:**
- Implement React hooks for document loading
- Add component tests

**Tests:**
- Loading states
- Error states
- Data states
- Re-fetching behavior

**Files:**
- `src/lib/content/hooks/useDocument.ts`
- `src/lib/content/hooks/useMDXContent.ts`
- `src/lib/content/tests/hooks/useDocument.test.ts`
- `src/lib/content/tests/hooks/useMDXContent.test.ts`

**Current Dependencies:**
- `useMDXProcessor` in `src/lib/hooks/useMDXProcessor.ts`
- Document service from previous step

**Expected Usage:**
```tsx
import { useDocument } from '@/lib/content/hooks/useDocument';
import { useMDXContent } from '@/lib/content/hooks/useMDXContent';

function DocumentComponent({ path }) {
  const { document, loading, error } = useDocument(path, 'doc');
  const { compiledMDX, processing } = useMDXContent(document);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <MDXRenderer code={compiledMDX.code} />;
}
```

### Phase 4: Migration

#### Step 10: Migrate Docs

**Changes:**
- Update `DocsPage.tsx` to use new hooks and services
- Fix the "Untitled Document" issue through proper error handling
- Add tests for docs behavior

**Tests:**
- Loading docs
- Handling invalid paths
- Error states

**Files to modify:**
- `src/components/DocsPage.tsx`
- `src/components/DocsLayout.tsx`

**Current Dependencies:**
- Current implementation in `DocsPage.tsx` (lines 36-66)

**Current Issues:**
- "Untitled Document" appears instead of proper error
- `getDoc` returns placeholder content for invalid paths

**Migration Strategy:**
1. Replace `getDoc` call with `useDocument` hook
2. Update error handling to check for `DocumentNotFoundError`
3. Remove local error state in favor of hook's error state
4. Keep the same rendering logic for loading/error/content states

#### Step 11: Migrate Blog

**Changes:**
- Update blog components to use new hooks and services
- Add tests for blog behavior

**Tests:**
- Loading blog posts
- Blog listings
- Error handling

**Files to modify:**
- `src/routes/blog.$slug.tsx`
- `src/routes/blog.index.tsx`

**Current Dependencies:**
- Current implementation in `blog.$slug.tsx` (lines 62-81)
- `getPostBySlug` and `getAllPosts` from `mdx.ts`

**Migration Strategy:**
1. Replace `getPostBySlug` call with `useDocument` hook
2. Replace `getAllPosts` with `useDocumentCollection` hook
3. Keep similar loading/error/content states

#### Step 12: Migrate Policy Pages

**Changes:**
- Update policy components to use new hooks and services
- Add tests for policy behavior

**Tests:**
- Loading policy pages
- Error handling

**Files to modify:**
- `src/routes/privacy.tsx`
- `src/routes/terms/use.tsx`
- `src/routes/terms/service.tsx`
- `src/components/PolicyPage.tsx`

**Current Dependencies:**
- Current implementation in `usePolicy` hook and `PolicyPage` component

**Migration Strategy:**
1. Replace `usePolicy` hook with `useDocument` hook
2. Adjust component to work with the new data structure
3. Keep similar loading/error/content states

### Phase 5: Cleanup

#### Step 13: Remove Legacy Code

**Changes:**
- Remove old content handling code
- Create utility modules for shared logic
- Final tests to ensure everything works

**Files to remove/refactor:**
- `src/lib/docs.ts`
- `src/lib/mdx.ts`
- `src/lib/policy-utils.ts`

**Migration Strategy:**
1. Ensure all components are using the new system
2. One file at a time, redirect any remaining imports
3. Remove the file once all dependencies are resolved

## Testing Strategy

### Unit Tests
- Each module will have its own test file
- Focus on testing public interfaces
- Use mock data for isolated testing

### Integration Tests
- Test interactions between modules
- Test full document loading pipeline
- Test error propagation

### Component Tests
- Test React hooks with React Testing Library
- Test loading, error, and success states
- Test user interactions

## Detailed Schedule

| Step | Task | Estimated Time | Dependencies |
|------|------|----------------|--------------|
| 1    | Content Types | 1 hr | None |
| 2    | Error Types | 1 hr | Content Types |
| 3    | Frontmatter Parser | 2 hrs | None |
| 4    | Path Resolver | 3 hrs | Content Types |
| 5    | Content Cache | 2 hrs | None |
| 6    | Metadata Service | 4 hrs | Content Types, Error Types |
| 7    | Content Loader | 3 hrs | Path Resolver, Content Cache |
| 8    | Document Service | 4 hrs | All previous components |
| 9    | React Hooks | 3 hrs | Document Service |
| 10   | Migrate Docs | 4 hrs | React Hooks |
| 11   | Migrate Blog | 3 hrs | React Hooks |
| 12   | Migrate Policy | 2 hrs | React Hooks |
| 13   | Cleanup | 2 hrs | All migrations |

**Total estimated time:** ~34 hours

## Success Criteria

1. All content types use the unified system
2. No duplicate code for content handling
3. Improved error handling (no more "Untitled Document" issues)
4. Comprehensive test coverage
5. No regression in functionality
6. Clean, maintainable codebase