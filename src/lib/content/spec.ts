/**
 * Content specification types
 *
 * These types are used to define the structure of content in _meta.ts files.
 * They define which documents are available in the site, and how they are organized in the sidebar.
 * They are distinct from the ContentMeta types used at runtime.
 */

// Define valid product names as a union type
export type ProductName = "mirascope" | "lilypad";

// Type for URL-friendly slugs (no slashes)
export type Slug = string; // In practice: enforced by regex /^[a-z0-9-_]+$/

export interface DocInfo {
  label: string;
  path: string; // Doc-relative path for content loading (product/section/slug format, may include /index)
  routePath: string; // URL path with /docs/ prefix and index pages represented as trailing slashes
  slug: string;
  type: "doc";
  product: ProductName; // Product this doc belongs to
  hasExtractableSnippets: boolean; // Whether this doc has extractable snippets
  searchWeight: number; // Computed weight based on hierarchical position
}

/**
 * Item in the documentation structure
 */
export interface DocSpec {
  slug: Slug; // URL slug component (no slashes)
  label: string; // Display name in sidebar
  children?: DocSpec[]; // Child items (if this is a folder)
  hasExtractableSnippets?: boolean;
  weight?: number; // Search weight for this item (multiplicative with parent weights)
}

/**
 * Section (top-level navigation)
 */
export interface SectionSpec {
  slug: Slug; // Section slug for URL
  label: string; // Display name
  children: DocSpec[]; // Items in this section
  weight?: number; // Search weight for this section (multiplicative with product weight)
}

/**
 * Product documentation structure
 */
export interface ProductSpec {
  product: ProductName;
  // All sections (including the main/default section)
  // A section with slug "index" is treated as the default section (no prefix in URL)
  sections: SectionSpec[];
  weight?: number; // Base search weight for this product
}

/**
 * Overall docs structure (ProductSpec for each product)
 */
export type FullDocsSpec = ProductSpec[];

/**
 * Validation results
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Process a doc specification and build DocInfo items
 * @param docSpec Doc specification
 * @param product Product this doc belongs to
 * @param pathPrefix Base path for this doc
 * @param parentWeight Accumulated weight from parent nodes
 * @returns Array of DocInfo items from this doc and its children
 */
export function processDocSpec(
  docSpec: DocSpec,
  product: ProductName,
  pathPrefix: string,
  parentWeight: number = 1.0
): DocInfo[] {
  const result: DocInfo[] = [];

  const slug = docSpec.slug;

  // Calculate the current weight by multiplying parent weight with this item's weight
  const currentWeight = parentWeight * (docSpec.weight || 1.0);

  // Simple path construction for content loading - always include the slug
  const path = `${pathPrefix}/${slug}`;

  // For URL route path: handle index pages with trailing slashes
  let routePath = `/docs/${pathPrefix}`;
  if (slug !== "index") {
    routePath += `/${slug}`; // Add the slug for non-index pages
  }

  // Add this doc to the result if it's a page (has content)
  if (!docSpec.children) {
    result.push({
      label: docSpec.label,
      slug: docSpec.slug,
      path,
      routePath,
      type: "doc",
      product,
      hasExtractableSnippets: docSpec.hasExtractableSnippets || false,
      searchWeight: currentWeight,
    });
  }

  // Process children recursively with updated section path and weight
  if (docSpec.children && docSpec.children.length > 0) {
    docSpec.children.forEach((childSpec) => {
      const childItems = processDocSpec(childSpec, product, path, currentWeight);
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
export function getDocsFromSpec(fullSpec: FullDocsSpec): DocInfo[] {
  const allDocs: DocInfo[] = [];

  fullSpec.forEach((productSpec) => {
    const { product, sections, weight: productWeight = 1.0 } = productSpec;

    // Process all sections
    sections.forEach((section) => {
      // For the default section (index), don't add a section slug prefix
      const isDefaultSection = section.slug === "index";
      const sectionPathPrefix = isDefaultSection ? product : `${product}/${section.slug}`;

      // Process each document in this section
      section.children.forEach((docSpec) => {
        const docItems = processDocSpec(docSpec, product, sectionPathPrefix, productWeight);
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
 * Validate an entire FullDocsSpec
 */
export function validateFullDocsSpec(specs: FullDocsSpec): ValidationResult {
  const errors: string[] = [];

  // Validate each product
  specs.forEach((productSpec) => {
    const productResult = validateProductSpec(productSpec);
    if (!productResult.isValid) {
      errors.push(
        ...productResult.errors.map((err) => `In product "${productSpec.product}": ${err}`)
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}
