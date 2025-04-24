/**
 * Content specification types
 *
 * These types are used to define the structure of content in _meta.ts files.
 * They are distinct from the ContentMeta types used at runtime.
 */

import type { DocMeta } from "./content-types";

// Type for URL-friendly slugs (no slashes)
export type Slug = string; // In practice: enforced by regex /^[a-z0-9-_]+$/

/**
 * Item in the documentation structure
 */
export interface DocSpec {
  slug: Slug; // URL slug component (no slashes)
  label: string; // Display name in sidebar
  children?: DocSpec[]; // Child items (if this is a folder)
  hasExtractableSnippets?: boolean;
}

/**
 * Section (top-level navigation)
 */
export interface SectionSpec {
  slug: Slug; // Section slug for URL
  label: string; // Display name
  children: DocSpec[]; // Items in this section
}

/**
 * Product documentation structure
 */
export interface ProductSpec {
  // All sections (including the main/default section)
  // A section with slug "index" is treated as the default section (no prefix in URL)
  sections: SectionSpec[];
}

/**
 * Overall docs structure (collection of ProductSpec by product name)
 */
export interface ProductDocsSpec {
  [product: string]: ProductSpec;
}

/**
 * Validation results
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Process a doc specification and build DocMeta items
 * @param docSpec Doc specification
 * @param product Product this doc belongs to
 * @param pathPrefix Base path for this doc
 * @returns Array of DocMeta items from this doc and its children
 */
export function processDocSpec(
  docSpec: DocSpec,
  product: string,
  pathPrefix: string = ""
): DocMeta[] {
  const result: DocMeta[] = [];

  // Build the path for this doc
  const docPath = pathPrefix ? `${pathPrefix}/${docSpec.slug}` : `${product}/${docSpec.slug}`;

  // Add this doc to the result if it's a page (has content)
  if (!docSpec.children) {
    result.push({
      title: docSpec.label,
      description: "", // Will be populated from frontmatter later
      slug: docSpec.slug,
      path: docPath,
      type: "doc",
      product,
      hasExtractableSnippets: docSpec.hasExtractableSnippets || false,
    });
  }

  // Process children recursively
  if (docSpec.children && docSpec.children.length > 0) {
    docSpec.children.forEach((childSpec) => {
      const childItems = processDocSpec(childSpec, product, docPath);
      result.push(...childItems);
    });
  }

  return result;
}

/**
 * Get all docs metadata from a ProductDocsSpec
 * Processes the ProductDocsSpec and returns DocMeta items
 * @param docsSpec The specification to process
 * @returns Array of DocMeta for all products and docs
 */
export function getDocsFromSpec(docsSpec: ProductDocsSpec): DocMeta[] {
  const allDocs: DocMeta[] = [];

  // Process each product in the spec
  Object.entries(docsSpec).forEach(([product, productSpec]) => {
    // Process all sections
    productSpec.sections.forEach((section) => {
      // For the default section (index), don't add a section slug prefix
      const isDefaultSection = section.slug === "index";
      const sectionPathPrefix = isDefaultSection ? product : `${product}/${section.slug}`;

      // Process each document in this section
      section.children.forEach((docSpec) => {
        const docItems = processDocSpec(docSpec, product, sectionPathPrefix);
        allDocs.push(...docItems);
      });
    });
  });

  return allDocs;
}

/**
 * Validate a slug to ensure it matches URL-friendly format
 *
 * Rules:
 * - Must be lowercase
 * - Can only contain a-z, 0-9, hyphen, and underscore
 * - Cannot contain slashes
 */
export function validateSlug(slug: string): ValidationResult {
  const errors: string[] = [];

  // Check for empty slugs
  if (!slug || slug.trim() === "") {
    errors.push("Slug cannot be empty");
    return { isValid: false, errors };
  }

  // Check for valid characters
  const validSlugRegex = /^[a-z0-9-_]+$/;
  if (!validSlugRegex.test(slug)) {
    errors.push("Slug must contain only lowercase letters, numbers, hyphens, and underscores");
  }

  // Check for slashes
  if (slug.includes("/")) {
    errors.push("Slug cannot contain slashes");
  }

  // Special case for 'index' which is always valid
  if (slug === "index" && errors.length === 0) {
    return { isValid: true, errors: [] };
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Checks for duplicate slugs at the same level
 */
function checkDuplicateSlugs(items: DocSpec[]): ValidationResult {
  const errors: string[] = [];
  const slugMap = new Map<string, string[]>();

  // Group items by slug
  items.forEach((item) => {
    if (!slugMap.has(item.slug)) {
      slugMap.set(item.slug, []);
    }
    slugMap.get(item.slug)!.push(item.label);
  });

  // Check for duplicates
  for (const [slug, labels] of slugMap.entries()) {
    if (labels.length > 1) {
      errors.push(`Duplicate slug "${slug}" found for items: ${labels.join(", ")}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a DocSpec for logical consistency
 */
export function validateDocSpec(spec: DocSpec): ValidationResult {
  const errors: string[] = [];

  // Validate slug
  const slugResult = validateSlug(spec.slug);
  if (!slugResult.isValid) {
    errors.push(...slugResult.errors.map((err) => `Invalid slug "${spec.slug}": ${err}`));
  }

  // Validate children if present
  if (spec.children) {
    // Check for duplicates within children
    const childrenResult = checkDuplicateSlugs(spec.children);
    if (!childrenResult.isValid) {
      errors.push(...childrenResult.errors.map((err) => `In "${spec.label}": ${err}`));
    }

    // Recursively validate each child
    spec.children.forEach((child) => {
      const childResult = validateDocSpec(child);
      if (!childResult.isValid) {
        errors.push(...childResult.errors.map((err) => `In child "${child.label}": ${err}`));
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a SectionSpec
 */
export function validateSectionSpec(spec: SectionSpec): ValidationResult {
  const errors: string[] = [];

  // Validate slug
  const slugResult = validateSlug(spec.slug);
  if (!slugResult.isValid) {
    errors.push(...slugResult.errors.map((err) => `Invalid section slug "${spec.slug}": ${err}`));
  }

  // Ensure section has children
  if (!spec.children || spec.children.length === 0) {
    errors.push(`Section "${spec.label}" must have at least one child`);
  } else {
    // Check for duplicates within children
    const childrenResult = checkDuplicateSlugs(spec.children);
    if (!childrenResult.isValid) {
      errors.push(...childrenResult.errors.map((err) => `In section "${spec.label}": ${err}`));
    }

    // Validate each child
    spec.children.forEach((child) => {
      const childResult = validateDocSpec(child);
      if (!childResult.isValid) {
        errors.push(
          ...childResult.errors.map(
            (err) => `In section "${spec.label}", child "${child.label}": ${err}`
          )
        );
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a ProductSpec
 */
export function validateProductSpec(spec: ProductSpec): ValidationResult {
  const errors: string[] = [];

  // Validate sections
  if (spec.sections) {
    // Check for duplicate section slugs
    const sectionSlugs = spec.sections.map((s) => s.slug);
    const uniqueSlugs = new Set(sectionSlugs);
    if (uniqueSlugs.size < sectionSlugs.length) {
      errors.push("Duplicate section slugs found");
    }

    // Validate each section
    spec.sections.forEach((section) => {
      const sectionResult = validateSectionSpec(section);
      if (!sectionResult.isValid) {
        errors.push(...sectionResult.errors.map((err) => `In section "${section.label}": ${err}`));
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate an entire ProductDocsSpec
 */
export function validateProductDocsSpec(spec: ProductDocsSpec): ValidationResult {
  const errors: string[] = [];

  // Validate each product
  for (const [product, productSpec] of Object.entries(spec)) {
    const productResult = validateProductSpec(productSpec);
    if (!productResult.isValid) {
      errors.push(...productResult.errors.map((err) => `In product "${product}": ${err}`));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
