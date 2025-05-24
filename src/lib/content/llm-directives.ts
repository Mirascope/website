/**
 * Content inclusion directive types
 */
export type IncludeType = "exact" | "glob" | "wildcard";

/**
 * Include directive for referencing content to aggregate
 */
export interface IncludeDirective {
  type: IncludeType;
  pattern: string;
}

/**
 * Simplified LLM document directive (checked into repo)
 */
export interface LLMDocDirective {
  title: string;
  description: string;
  routePath: string; // Where this document should be available (e.g., "docs/llms-full")
  includes: IncludeDirective[];
}

/**
 * LLM Meta file structure - central registry for all LLM documents
 */
export interface LLMDocMeta {
  documents: LLMDocDirective[];
}

/**
 * Helper functions for creating type-safe include directives
 */
export const include = {
  /**
   * Include a specific document by exact path
   */
  exact: (pattern: string): IncludeDirective => ({
    type: "exact",
    pattern,
  }),

  /**
   * Include direct children matching pattern (no subdirectories)
   * Example: 'mirascope/learn/*.mdx' includes files directly in learn/ but not in learn/subfolder/
   */
  glob: (pattern: string): IncludeDirective => ({
    type: "glob",
    pattern,
  }),

  /**
   * Include all content recursively matching pattern
   * Example: 'lilypad/*' includes all content under lilypad/ at any depth
   */
  wildcard: (pattern: string): IncludeDirective => ({
    type: "wildcard",
    pattern,
  }),
};

/**
 * Define an LLM document directive with type safety and validation
 */
export function defineLLMDocDirective(doc: LLMDocDirective): LLMDocDirective {
  // Basic validation
  if (!doc.title) {
    throw new Error("LLM document must have a title");
  }
  if (!doc.description) {
    throw new Error("LLM document must have a description");
  }
  if (!doc.routePath) {
    throw new Error("LLM document must have a routePath");
  }
  if (!doc.includes || doc.includes.length === 0) {
    throw new Error("LLM document must have at least one include directive");
  }

  return doc;
}
