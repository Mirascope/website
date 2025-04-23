import { meta as docsMetadata } from "@/content/doc/_meta";
import { getSectionsForProduct } from "@/src/lib/content/docs";
import { getProductRoute } from "@/src/lib/routes";
import type { ProductName } from "@/src/lib/route-types";
import { type Provider } from "../ProviderContext";
import Sidebar from "@/src/components/Sidebar";
import type {
  SidebarConfig,
  SidebarItem,
  SidebarGroup,
  SidebarSection,
} from "@/src/components/Sidebar";
import { Link } from "@tanstack/react-router";

interface DocsSidebarProps {
  product: ProductName;
  selectedProvider?: Provider;
  onProviderChange?: (provider: Provider) => void;
}

// Components for product selector header
const ProductTitle = ({ product }: { product: ProductName }) => {
  const titleClass = `text-xl font-medium ${product === "mirascope" ? "text-mirascope-purple" : "text-lilypad-green"}`;
  return <span className={titleClass}>{product === "mirascope" ? "Mirascope" : "Lilypad"}</span>;
};

const ProductLink = ({ product }: { product: ProductName }) => {
  return (
    <Link
      to={getProductRoute(product)}
      className={`text-xl font-medium text-muted-foreground hover:text-accent-foreground`}
    >
      {product === "mirascope" ? "Mirascope" : "Lilypad"}
    </Link>
  );
};

/**
 * Helper to convert the legacy doc metadata to the new sidebar format
 */
function createSidebarConfig(product: ProductName): SidebarConfig {
  const productData = docsMetadata[product];
  const sections = getSectionsForProduct(product);

  // If no product data available, return minimal config
  if (!productData) {
    return {
      label: product,
      sections: [],
      activeColors: {
        bg: product === "mirascope" ? "bg-button-primary" : "bg-lilypad-green",
        text: "text-white",
      },
      inactiveColors: {
        text: "muted-foreground",
        hoverBg: "accent",
        hoverText: "accent-foreground",
      },
      accentColor: product === "mirascope" ? "text-mirascope-purple" : "text-lilypad-green",
    };
  }

  // Create ordered sections with Guides between Docs and API
  let orderedSections = [...sections]; // Clone the array
  if (sections.some((s) => s.slug === "guides") && sections.some((s) => s.slug === "api")) {
    // Filter out guides and api first
    const guidesSection = sections.find((s) => s.slug === "guides");
    const apiSection = sections.find((s) => s.slug === "api");
    const otherSections = sections.filter((s) => s.slug !== "guides" && s.slug !== "api");

    // Rebuild the array in the desired order: [other sections, guides, api]
    orderedSections = [...otherSections];
    if (guidesSection) orderedSections.push(guidesSection);
    if (apiSection) orderedSections.push(apiSection);
  }

  // Convert items from legacy format to new sidebar item format
  function convertItems(items: Record<string, any>): Record<string, SidebarItem> {
    const result: Record<string, SidebarItem> = {};

    for (const [slug, item] of Object.entries(items)) {
      result[slug] = {
        slug,
        label: item.title,
        items: item.items ? convertItems(item.items) : undefined,
      };
    }

    return result;
  }

  // Convert groups from legacy format to new sidebar group format
  function convertGroups(groups: Record<string, any>): Record<string, SidebarGroup> {
    const result: Record<string, SidebarGroup> = {};

    for (const [slug, group] of Object.entries(groups)) {
      result[slug] = {
        slug,
        label: group.title,
        items: convertItems(group.items || {}),
      };
    }

    return result;
  }

  // Create the main docs section
  const mainSection: SidebarSection = {
    slug: "docs",
    label: "Docs",
    basePath: `/docs/${product}`,
    items: convertItems(productData.items || {}),
    groups: convertGroups(productData.groups || {}),
  };

  // Create additional sections
  const additionalSections: SidebarSection[] = orderedSections.map((section) => {
    const sectionData = productData.sections?.[section.slug];

    return {
      slug: section.slug,
      label: section.title,
      basePath: `/docs/${product}/${section.slug}`,
      items: sectionData ? convertItems(sectionData.items || {}) : {},
      groups: sectionData ? convertGroups(sectionData.groups || {}) : {},
    };
  });

  // Return the complete sidebar config
  return {
    label: product,
    sections: [mainSection, ...additionalSections],
    activeColors: {
      bg: product === "mirascope" ? "bg-button-primary" : "bg-lilypad-green",
      text: "text-white",
    },
    inactiveColors: {
      text: "muted-foreground",
      hoverBg: "accent",
      hoverText: "accent-foreground",
    },
    accentColor: product === "mirascope" ? "text-mirascope-purple" : "text-lilypad-green",
  };
}

const DocsSidebar = ({ product }: DocsSidebarProps) => {
  // Create product selector header
  const ProductSelector = () => (
    <div className="flex space-x-4">
      {product === "mirascope" ? (
        <ProductTitle product="mirascope" />
      ) : (
        <ProductLink product="mirascope" />
      )}

      {product === "lilypad" ? (
        <ProductTitle product="lilypad" />
      ) : (
        <ProductLink product="lilypad" />
      )}
    </div>
  );

  // Create sidebar configuration
  const sidebarConfig = createSidebarConfig(product);

  return <Sidebar config={sidebarConfig} headerContent={<ProductSelector />} />;
};

export default DocsSidebar;
