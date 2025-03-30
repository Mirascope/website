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
        title: "Welcome",
        description: "Welcome to the Mirascope documentation."
      },
      migration: {
        title: "Migration Guide",
        description: "Migration guide for Mirascope."
      }
    },
    
    // Grouped pages in main area
    groups: {
      "getting-started": {
        title: "Getting Started",
        description: "Get up and running with Mirascope",
        items: {
          quickstart: {
            title: "Quickstart",
            description: "Get up and running with Mirascope in minutes."
          },
          "installation": {
            title: "Installation",
            description: "How to install Mirascope."
          }
        }
      }
    },
    
    // Sections (like API)
    sections: {
      api: {
        title: "API",
        description: "Mirascope API documentation",
        
        // Top-level API pages
        items: {
          index: {
            title: "API Overview",
            description: "Overview of the Mirascope API."
          },
          quickstart: {
            title: "Quickstart",
            description: "Woah",
          }
        },
        
        // Grouped API pages
        groups: {
          llm: {
            title: "LLM",
            description: "LLM-related API",
            items: {
              generation: {
                title: "llm.generation",
                description: "The llm.generation decorator."
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
        title: "Welcome",
        description: "Welcome to the Lilypad documentation."
      }
    },
    
    // Grouped pages in main area
    groups: {
      "getting-started": {
        title: "Getting Started",
        description: "Get up and running with Lilypad",
        items: {
          quickstart: {
            title: "Quickstart",
            description: "Get up and running with Lilypad in minutes."
          },
          installation: {
            title: "Installation",
            description: "How to install Lilypad."
          }
        }
      }
    },
    
    // Sections (like API)
    sections: {
      api: {
        title: "API",
        description: "Lilypad API documentation",
        
        // Top-level API pages
        items: {
          index: {
            title: "API Overview",
            description: "Overview of the Lilypad API."
          },
          quickstart: {
            title: "Quickstart",
            description: "Woah",
          }
        },
        
        // Grouped API pages
        // Grouped API pages
        groups: {
          llm: {
            title: "LLM",
            description: "LLM-related API",
            items: {
              generation: {
                title: "llm.generation",
                description: "The llm.generation decorator."
              }
            }
          }
        }
      }
    }
  }
};

export default meta;