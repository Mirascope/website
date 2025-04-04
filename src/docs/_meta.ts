/**
 * Documentation structure for all products
 *
 * This file defines the structure, order, and metadata for all documentation.
 *
 * Structure:
 * - Top-level keys are product names (mirascope, lilypad)
 * - Each product contains:
 *   - items: Top-level documents
 *   - groups: Organized groups of documents
 *   - sections: Major sections like "API"
 */

// Basic item structure
export interface DocMetaItem {
  title: string;
  description?: string;
}

// Group of documents
export interface DocGroup {
  title: string;
  description?: string;
  items: Record<string, DocMetaItem>;
}

// Section of documentation (like API)
export interface DocSection {
  title: string;
  description?: string;
  defaultSlug?: string;
  items: Record<string, DocMetaItem>; // Direct section items
  groups?: Record<string, DocGroup>; // Grouped section items
}

// Product documentation
export interface ProductDocs {
  items: Record<string, DocMetaItem>; // Top-level items
  groups: Record<string, DocGroup>; // Grouped items
  sections: Record<string, DocSection>; // Sections (like API)
}

// Overall docs structure
export interface DocsStructure {
  [product: string]: ProductDocs;
}

const meta: DocsStructure = {
  // Mirascope Documentation
  mirascope: {
    // Top level pages
    items: {
      index: {
        title: "Welcome",
      },
    },

    // Grouped pages in main area
    groups: {
      "getting-started": {
        title: "Getting Started",
        items: {
          quickstart: {
            title: "Quickstart",
            description: "Get started with Mirascope",
          },
          why: {
            title: "Why Mirascope?",
          },
          help: {
            title: "Help",
            description: "How to get help with Mirascope",
          },
          contributing: {
            title: "Contributing",
            description: "How to contribute to Mirascope",
          },
          migration: {
            title: "0.x Migration Guide",
          },
        },
      },
    },

    // Sections (like API, Guides)
    sections: {
      api: {
        title: "API",

        // Top-level API pages
        items: {
          index: {
            title: "Under construction...",
          },
        },
      },
    },
  },

  // Lilypad Documentation
  lilypad: {
    // Top level pages
    items: {
      index: {
        title: "Welcome",
      },
    },

    // Grouped pages in main area
    groups: {
      "getting-started": {
        title: "Getting Started",
        items: {
          quickstart: {
            title: "Quickstart",
          },
          installation: {
            title: "Installation",
          },
        },
      },
    },

    // Sections (like API, Guides)
    sections: {
      api: {
        title: "API",

        // Top-level API pages
        items: {
          index: {
            title: "Under construction...",
          },
        },
      },
    },
  },
};

export default meta;
