import { docRegistry } from "@/src/lib/content";
import type { DocSpec, ProductName } from "@/src/lib/content/doc-registry";
import { type Provider } from "@/src/components/mdx/providers";
import { Sidebar } from "@/src/components";
import type {
  SidebarConfig,
  SidebarItem,
  SidebarGroup,
  SidebarSection,
} from "@/src/components/core/layout/Sidebar";
import { PRODUCT_CONFIGS } from "@/src/lib/constants/site";

interface DocsSidebarProps {
  product: ProductName;
  selectedProvider?: Provider;
  onProviderChange?: (provider: Provider) => void;
}

// No product selector needed in sidebar - now in header

/**
 * Helper to convert the spec metadata to the sidebar format
 */
function createSidebarConfig(product: ProductName): SidebarConfig {
  // Get product spec from the registry
  const productSpec = docRegistry.getProductSpec(product);

  // Get all DocInfo objects for this product
  const allDocInfo = docRegistry.getDocsByProduct(product);

  // Create a map from slug pattern to routePath for quick lookup
  // Key format: product/section/slug or product/slug for root items
  const slugToRoutePathMap: Map<string, string> = new Map();

  allDocInfo.forEach((doc) => {
    if (doc.product === product) {
      // Extract the slug pattern from the path
      // This could be product/section/slug or product/slug
      const keyPath = doc.path;
      slugToRoutePathMap.set(keyPath, doc.routePath);
    }
  });

  // If no product spec available, return minimal config
  if (!productSpec) {
    return {
      label: product,
      sections: [],
    };
  }

  // Get all sections and order them appropriately
  let allSections = [...productSpec.sections];

  // Find index section to ensure it appears first
  const defaultIndex = allSections.findIndex((s) => s.slug === "index");
  if (defaultIndex > 0) {
    // Move index section to the front
    const defaultSection = allSections.splice(defaultIndex, 1)[0];
    allSections.unshift(defaultSection);
  }

  // The rest of the sections remain in the order defined in the spec

  // Convert doc specs to sidebar items
  function convertDocToSidebarItem(doc: DocSpec, parentPath: string = ""): SidebarItem {
    // Construct the logical path for this item (used to look up routePath)
    const itemPath = parentPath ? `${parentPath}/${doc.slug}` : `${product}/${doc.slug}`;

    // Look up the routePath from DocInfo if available
    const routePath = slugToRoutePathMap.get(itemPath);

    const item: SidebarItem = {
      slug: doc.slug,
      label: doc.label,
    };

    // Add routePath if we found a match
    if (routePath) {
      item.routePath = routePath;
    }

    // Process children if any
    if (doc.children && doc.children.length > 0) {
      item.items = {};

      doc.children.forEach((childDoc) => {
        const childItem = convertDocToSidebarItem(childDoc, itemPath);
        if (item.items) {
          item.items[childDoc.slug] = childItem;
        }
      });
    }

    return item;
  }

  // Create sidebar sections from spec sections
  const sidebarSections: SidebarSection[] = allSections.map((section) => {
    // Create basePath - for index section, don't include the section slug
    const basePath =
      section.slug === "index" ? `/docs/${product}` : `/docs/${product}/${section.slug}`;

    // Process direct items (those without children) and create groups for top-level folders
    const items: Record<string, SidebarItem> = {};
    const groups: Record<string, SidebarGroup> = {};

    // Get path prefix for section items (used for lookup)
    const pathPrefix = section.slug === "index" ? product : `${product}/${section.slug}`;

    section.children.forEach((child) => {
      if (!child.children || child.children.length === 0) {
        // This is a direct item, add it to items
        // Convert using our helper that adds routePath
        items[child.slug] = convertDocToSidebarItem(child, pathPrefix);
      } else {
        // This is a top-level folder, add it as a group
        const groupItems: Record<string, SidebarItem> = {};

        // Get path for this group's children
        const groupPathPrefix = `${pathPrefix}/${child.slug}`;

        // Process all items in this group
        child.children.forEach((grandchild) => {
          // Convert the grandchild and its descendants to sidebar items
          const sidebarItem = convertDocToSidebarItem(grandchild, groupPathPrefix);
          groupItems[grandchild.slug] = sidebarItem;
        });

        // Add the group
        groups[child.slug] = {
          slug: child.slug,
          label: child.label,
          items: groupItems,
        };
      }
    });

    return {
      slug: section.slug,
      label: section.label,
      basePath,
      items,
      groups: Object.keys(groups).length > 0 ? groups : undefined,
    };
  });
  const productTitle = PRODUCT_CONFIGS[product]?.title || product;
  // Inject LLM Documentation section
  const llmItem: SidebarItem = {
    slug: "llms",
    label: `${productTitle} LLMs Text`,
    routePath: `/docs/${product}/llms/`,
  };
  const llmSection: SidebarSection = {
    slug: "llms",
    label: "LLMs Text",
    basePath: `/docs/${product}/llms/`,
    items: { llms: llmItem },
  };

  // Add the LLM section to the end
  sidebarSections.push(llmSection);

  // Return the complete sidebar config
  return {
    label: product,
    sections: sidebarSections,
  };
}

const DocsSidebar = ({ product }: DocsSidebarProps) => {
  // Create sidebar configuration
  const sidebarConfig = createSidebarConfig(product);

  // No header content needed since product links are in the main header now
  return <Sidebar config={sidebarConfig} />;
};

export default DocsSidebar;
