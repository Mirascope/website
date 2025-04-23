/**
 * Convert between new DocSpec format and legacy ProductDocs format
 *
 * This provides compatibility with the existing codebase while we migrate to the new format.
 */

import type { DocSpec, SectionSpec, ProductSpec, DocsSpec } from "./spec";
import type {
  DocMetaItem,
  DocGroup,
  DocSection,
  ProductDocs,
  DocsStructure,
} from "./legacy-doc-meta";

/**
 * Convert a DocSpec to a legacy DocMetaItem
 */
export function convertDocToLegacy(doc: DocSpec): DocMetaItem {
  const legacyItem: DocMetaItem = {
    title: doc.label,
  };

  // Copy extractable snippets flag
  if (doc.hasExtractableSnippets) {
    legacyItem.hasExtractableSnippets = true;
  }

  // Convert children if present
  if (doc.children && doc.children.length > 0) {
    legacyItem.items = {};

    // Convert each child to legacy format
    doc.children.forEach((child) => {
      legacyItem.items![child.slug] = convertDocToLegacy(child);
    });
  }

  return legacyItem;
}

/**
 * Convert an array of DocSpec to a Record of legacy DocMetaItems
 */
export function convertDocsToLegacyRecord(docs: DocSpec[]): Record<string, DocMetaItem> {
  const result: Record<string, DocMetaItem> = {};

  docs.forEach((doc) => {
    result[doc.slug] = convertDocToLegacy(doc);
  });

  return result;
}

/**
 * Convert a SectionSpec to a legacy DocSection
 */
export function convertSectionToLegacy(section: SectionSpec): DocSection {
  // Start by creating the basic section
  const legacySection: DocSection = {
    title: section.label,
    items: {},
  };

  // Process children
  if (section.children && section.children.length > 0) {
    // For sections, we need to be even more careful about matching the original structure
    // In the original structure, most section children were direct items, except for specific groups

    // Extract direct items that don't have children
    const directItems: DocSpec[] = section.children.filter(
      (child) => !child.children || child.children.length === 0
    );

    // Convert direct items
    legacySection.items = convertDocsToLegacyRecord(directItems);

    // If there are nested items with children, see if we need to convert them as groups
    const nestedItems = section.children.filter(
      (child) => child.children && child.children.length > 0
    );

    if (nestedItems.length > 0) {
      legacySection.groups = {};

      // Convert nested items as groups
      nestedItems.forEach((nestedItem) => {
        legacySection.groups![nestedItem.slug] = {
          title: nestedItem.label,
          items: convertDocsToLegacyRecord(nestedItem.children || []),
        };
      });
    }
  }

  return legacySection;
}

/**
 * Convert a ProductSpec to a legacy ProductDocs
 */
export function convertProductToLegacy(productSpec: ProductSpec): ProductDocs {
  // Create the basic product structure
  const legacyProduct: ProductDocs = {
    items: {},
    groups: {},
    sections: {},
  };

  // Simple rule: in the default section, items with children are groups,
  // items without children are top-level items
  const topLevelItems: DocSpec[] = [];
  const groups: Record<string, DocSpec[]> = {};

  productSpec.defaultSection.forEach((item) => {
    if (item.children && item.children.length > 0) {
      // This is a group
      groups[item.slug] = item.children;
    } else {
      // This is a top-level item
      topLevelItems.push(item);
    }
  });

  // Convert top-level items
  legacyProduct.items = convertDocsToLegacyRecord(topLevelItems);

  // Convert groups
  if (Object.keys(groups).length > 0) {
    Object.entries(groups).forEach(([groupSlug, groupItems]) => {
      const group = productSpec.defaultSection.find((item) => item.slug === groupSlug);
      legacyProduct.groups[groupSlug] = {
        title:
          group?.label || groupSlug.charAt(0).toUpperCase() + groupSlug.slice(1).replace(/-/g, " "),
        items: convertDocsToLegacyRecord(groupItems),
      };
    });
  }

  // Convert sections
  if (productSpec.sections && productSpec.sections.length > 0) {
    productSpec.sections.forEach((section) => {
      legacyProduct.sections[section.slug] = convertSectionToLegacy(section);
    });
  }

  return legacyProduct;
}

/**
 * Convert an entire DocsSpec to legacy DocsStructure
 */
export function convertDocsToLegacy(docsSpec: DocsSpec): DocsStructure {
  const legacyDocs: DocsStructure = {};

  Object.entries(docsSpec).forEach(([product, productSpec]) => {
    legacyDocs[product] = convertProductToLegacy(productSpec);
  });

  return legacyDocs;
}

/**
 * Convert legacy DocMetaItem to new DocSpec
 */
export function convertLegacyToDoc(slug: string, legacyItem: DocMetaItem): DocSpec {
  const newDoc: DocSpec = {
    slug,
    label: legacyItem.title,
  };

  // Set extractable snippets flag if present
  if (legacyItem.hasExtractableSnippets) {
    newDoc.hasExtractableSnippets = true;
  }

  // If there are nested items, convert children
  if (legacyItem.items && Object.keys(legacyItem.items).length > 0) {
    newDoc.children = [];

    Object.entries(legacyItem.items).forEach(([childSlug, childItem]) => {
      newDoc.children!.push(convertLegacyToDoc(childSlug, childItem));
    });
  }

  return newDoc;
}

/**
 * Convert legacy DocGroup to new DocSpec with children
 */
export function convertLegacyGroupToDoc(slug: string, legacyGroup: DocGroup): DocSpec {
  const newDoc: DocSpec = {
    slug,
    label: legacyGroup.title,
    children: [],
  };

  // Convert all items in the group
  Object.entries(legacyGroup.items).forEach(([itemSlug, item]) => {
    newDoc.children!.push(convertLegacyToDoc(itemSlug, item));
  });

  return newDoc;
}

/**
 * Convert legacy DocSection to new SectionSpec
 */
export function convertLegacySectionToSection(
  slug: string,
  legacySection: DocSection
): SectionSpec {
  const newSection: SectionSpec = {
    slug,
    label: legacySection.title,
    children: [],
  };

  // Convert direct section items
  Object.entries(legacySection.items || {}).forEach(([itemSlug, item]) => {
    newSection.children.push(convertLegacyToDoc(itemSlug, item));
  });

  // Convert section groups
  if (legacySection.groups) {
    Object.entries(legacySection.groups).forEach(([groupSlug, group]) => {
      // Create a folder for the group
      const groupDoc: DocSpec = {
        slug: groupSlug,
        label: group.title,
        children: [],
      };

      // Convert all items in the group
      Object.entries(group.items).forEach(([itemSlug, item]) => {
        groupDoc.children!.push(convertLegacyToDoc(itemSlug, item));
      });

      // Add the group as a child of the section
      newSection.children.push(groupDoc);
    });
  }

  return newSection;
}

/**
 * Convert legacy ProductDocs to new ProductSpec
 */
export function convertLegacyToProduct(legacyProduct: ProductDocs): ProductSpec {
  const newProduct: ProductSpec = {
    defaultSectionLabel: "Docs",
    defaultSection: [],
    sections: [],
  };

  // Convert top-level items
  Object.entries(legacyProduct.items || {}).forEach(([slug, item]) => {
    newProduct.defaultSection.push(convertLegacyToDoc(slug, item));
  });

  // Convert groups as folders in the default section
  Object.entries(legacyProduct.groups || {}).forEach(([slug, group]) => {
    newProduct.defaultSection.push(convertLegacyGroupToDoc(slug, group));
  });

  // Convert sections
  Object.entries(legacyProduct.sections || {}).forEach(([slug, section]) => {
    newProduct.sections.push(convertLegacySectionToSection(slug, section));
  });

  return newProduct;
}

/**
 * Convert legacy DocsStructure to new DocsSpec
 */
export function convertLegacyToDocs(legacyDocs: DocsStructure): DocsSpec {
  const newDocs: DocsSpec = {};

  Object.entries(legacyDocs).forEach(([product, productDocs]) => {
    newDocs[product] = convertLegacyToProduct(productDocs);
  });

  return newDocs;
}
