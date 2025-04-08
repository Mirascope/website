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
  hasExtractableSnippets?: boolean; // Flag to indicate the doc has code snippets that should be extracted
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
        hasExtractableSnippets: true,
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
            hasExtractableSnippets: true,
          },
          why: {
            title: "Why Mirascope?",
            hasExtractableSnippets: true,
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
      learn: {
        title: "Learn",
        items: {
          index: {
            title: "Overview",
          },
          prompts: {
            title: "Prompts",
            hasExtractableSnippets: true,
          },
          calls: {
            title: "Calls",
            hasExtractableSnippets: true,
          },
          streams: {
            title: "Streams",
          },
          chaining: {
            title: "Chaining",
          },
          response_models: {
            title: "Response Models",
          },
          json_mode: {
            title: "JSON Mode",
          },
          output_parsers: {
            title: "Output Parsers",
          },
          tools: {
            title: "Tools",
          },
          agents: {
            title: "Agents",
          },
          evals: {
            title: "Evals",
          },
          async: {
            title: "Async",
          },
          retries: {
            title: "Retries",
          },
          local_models: {
            title: "Local Models",
          },
        },
      },
      // Provider-specific features
      "learn/provider-specific": {
        title: "Provider-Specific Features",
        items: {
          openai: {
            title: "OpenAI",
          },
          anthropic: {
            title: "Anthropic",
          },
        },
      },
      // Extensions
      "learn/extensions": {
        title: "Extensions",
        items: {
          middleware: {
            title: "Middleware",
          },
          custom_provider: {
            title: "Custom LLM Provider",
          },
        },
      },
      // MCP - Model Context Protocol
      "learn/mcp": {
        title: "MCP - Model Context Protocol",
        items: {
          client: {
            title: "Client",
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

    // Sections (like API)
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

/**
 * Helper function to iterate through all docs in the metadata
 * @returns An array of objects with product, path, and metadata for each doc
 */
export function getAllDocs(): Array<{ product: string; path: string; meta: DocMetaItem }> {
  const allDocs: Array<{ product: string; path: string; meta: DocMetaItem }> = [];

  // Loop through all products and their docs
  for (const [product, productDocs] of Object.entries(meta)) {
    // Process top-level items
    for (const [key, docMeta] of Object.entries(productDocs.items)) {
      allDocs.push({
        product,
        path: key,
        meta: docMeta,
      });
    }

    // Process items in groups
    for (const [groupKey, group] of Object.entries(productDocs.groups)) {
      for (const [itemKey, docMeta] of Object.entries(group.items)) {
        allDocs.push({
          product,
          path: `${groupKey}/${itemKey}`,
          meta: docMeta,
        });
      }
    }

    // Process items in sections
    for (const [sectionKey, section] of Object.entries(productDocs.sections)) {
      // Direct section items
      for (const [itemKey, docMeta] of Object.entries(section.items)) {
        allDocs.push({
          product,
          path: `${sectionKey}/${itemKey}`,
          meta: docMeta,
        });
      }

      // Items in section groups
      if (section.groups) {
        for (const [groupKey, group] of Object.entries(section.groups)) {
          for (const [itemKey, docMeta] of Object.entries(group.items)) {
            allDocs.push({
              product,
              path: `${sectionKey}/${groupKey}/${itemKey}`,
              meta: docMeta,
            });
          }
        }
      }
    }
  }

  return allDocs;
}

export default meta;
