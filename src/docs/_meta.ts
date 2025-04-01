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
}

// Group of documents
export interface DocGroup {
  title: string;
  items: Record<string, DocMetaItem>;
}

// Section of documentation (like API)
export interface DocSection {
  title: string; 
  defaultSlug?: string;
  items: Record<string, DocMetaItem>;  // Direct section items
  groups?: Record<string, DocGroup>;   // Grouped section items
}

// Product documentation
export interface ProductDocs {
  items: Record<string, DocMetaItem>;  // Top-level items
  groups: Record<string, DocGroup>;    // Grouped items
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
        title: "Welcome"
      },
      migration: {
        title: "Migration Guide"
      }
    },
    
    // Grouped pages in main area
    groups: {
      "getting-started": {
        title: "Getting Started",
        items: {
          quickstart: {
            title: "Quickstart"
          }
        }
      }
    },
    
    // Sections (like API)
    sections: {
      api: {
        title: "API",
        
        // Top-level API pages
        items: {
          index: {
            title: "API Overview"
          },
          quickstart: {
            title: "Quickstart"
          }
        },
        
        // Grouped API pages
        groups: {
          llm: {
            title: "LLM",
            items: {
              generation: {
                title: "llm.generation"
              }
            }
          }
        }
      }
    }
  },
  
  // Lilypad Documentation
  lilypad: {
    // Top level pages
    items: {
      index: {
        title: "Welcome"
      }
    },
    
    // Grouped pages in main area
    groups: {
      "getting-started": {
        title: "Getting Started",
        items: {
          quickstart: {
            title: "Quickstart"
          },
          installation: {
            title: "Installation"
          }
        }
      }
    },
    
    // Sections (like API)
    sections: {
      api: {
        title: "API",
        
        // Top-level API pages
        items: {
          index: {
            title: "API Overview"
          },
          quickstart: {
            title: "Quickstart"
          }
        },
        
        // Grouped API pages
        groups: {
          llm: {
            title: "LLM",
            items: {
              generation: {
                title: "llm.generation"
              }
            }
          }
        }
      }
    }
  }
};

export default meta;