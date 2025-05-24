/**
 * LLM Documents System
 *
 * Generates concatenated MDX documentation files optimized for LLM consumption.
 * These documents aggregate content from multiple existing documentation sources
 * into coherent, comprehensive documents.
 *
 * Key features:
 * - Type-safe document definitions with TypeScript DSL
 * - Flexible content inclusion patterns (exact, glob, wildcard)
 * - Build-time processing with token counting
 * - Structured JSON output for viewers
 */

import fs from "fs";
import path from "path";
import { getAllDocInfo } from "./content";
import { parseFrontmatter } from "./mdx-processing";
import { BASE_URL } from "../constants/site";
import type { DocInfo } from "./spec";

/* ========== CORE TYPES =========== */

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
 * Content section in processed LLM document
 */
export interface ContentSection {
  id: string; // "header" | "docs-mirascope-learn-calls" etc
  title: string;
  description?: string;
  url: string;
  type: "header" | "content";
  content: string; // includes <ContentSection> wrapper for content sections
  tokenCount: number;
}

/**
 * Complete processed LLM document
 */
export class LLMDocument {
  public metadata: {
    title: string;
    description: string;
    routePath: string;
    totalTokens: number;
    generatedAt: string;
    sectionsCount: number;
  };
  public sections: ContentSection[];

  constructor(metadata: LLMDocument["metadata"], sections: ContentSection[]) {
    this.metadata = metadata;
    this.sections = sections;
  }

  /**
   * Serialize to JSON for viewer consumption
   */
  toJSON(): object {
    return {
      metadata: this.metadata,
      sections: this.sections,
    };
  }

  /**
   * Generate .txt file content
   */
  toString(): string {
    return this.sections.map((section) => section.content).join("\n\n");
  }
}

/* ========== DSL HELPERS =========== */

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

/* ========== UTILITY FUNCTIONS =========== */

/**
 * Generate a slug-style ID from a route path
 * e.g., "/docs/mirascope/learn/calls" -> "docs-mirascope-learn-calls"
 */
export function generateSectionId(routePath: string): string {
  return routePath
    .replace(/^\/+|\/+$/g, "") // Remove leading/trailing slashes
    .replace(/\//g, "-") // Replace slashes with hyphens
    .toLowerCase();
}

/**
 * Accurate token counting using js-tiktoken (build-time only)
 * Tree-shaking will ensure this doesn't get bundled client-side
 */
export function countTokens(text: string): number {
  try {
    // Import dynamically to avoid bundling in client
    const { encodingForModel } = require("js-tiktoken");
    const encoder = encodingForModel("gpt-4");
    const tokens = encoder.encode(text);
    return tokens.length;
  } catch (error) {
    console.warn("Token counting failed, falling back to approximation:", error);
    return Math.ceil(text.length / 4);
  }
}

/* ========== CONTENT PROCESSING =========== */

/**
 * LLM document processor with configurable directories
 */
export class LLMDocumentProcessor {
  private readonly docsRoot: string;

  constructor(docsRoot?: string) {
    this.docsRoot = docsRoot || path.join(process.cwd(), "content", "docs");
  }

  /**
   * Process include directives to resolve actual content
   */
  resolveIncludes(includes: IncludeDirective[]): DocInfo[] {
    const allDocs = getAllDocInfo();
    const resolved: DocInfo[] = [];

    for (const include of includes) {
      const matchingDocs = this.filterDocsByInclude(allDocs, include);

      // Add matching docs in order, avoiding duplicates
      for (const doc of matchingDocs) {
        if (!resolved.some((d) => d.path === doc.path)) {
          resolved.push(doc);
        }
      }
    }

    return resolved;
  }

  /**
   * Filter docs based on include directive
   */
  private filterDocsByInclude(docs: DocInfo[], include: IncludeDirective): DocInfo[] {
    return docs.filter((doc) => this.matchesIncludePattern(doc.path, include));
  }

  /**
   * Check if a doc path matches an include pattern
   */
  private matchesIncludePattern(docPath: string, include: IncludeDirective): boolean {
    const normalizedPath = docPath.replace(/^\/+|\/+$/g, "");
    const normalizedPattern = include.pattern.replace(/^\/+|\/+$/g, "");

    switch (include.type) {
      case "exact":
        return normalizedPath === normalizedPattern.replace(/\.mdx$/, "");

      case "glob":
        if (normalizedPattern.endsWith("/*.mdx")) {
          const prefix = normalizedPattern.slice(0, -6); // Remove "/*.mdx"
          if (!normalizedPath.startsWith(prefix)) return false;
          const remainder = normalizedPath.slice(prefix.length);
          return remainder.startsWith("/") && !remainder.slice(1).includes("/");
        } else if (normalizedPattern.endsWith("/*")) {
          const prefix = normalizedPattern.slice(0, -2); // Remove "/*"
          if (!normalizedPath.startsWith(prefix)) return false;
          const remainder = normalizedPath.slice(prefix.length);
          return remainder.startsWith("/") && !remainder.slice(1).includes("/");
        }
        return false;

      case "wildcard":
        if (normalizedPattern.endsWith("/*")) {
          const prefix = normalizedPattern.slice(0, -2);
          return normalizedPath.startsWith(prefix);
        }
        return normalizedPath.startsWith(normalizedPattern);

      default:
        return false;
    }
  }

  /**
   * Generate content section from a doc
   */
  generateContentSection(doc: DocInfo): ContentSection {
    const filePath = path.join(this.docsRoot, `${doc.path}.mdx`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Required doc file not found: ${filePath}`);
    }

    const rawContent = fs.readFileSync(filePath, "utf-8");
    const { frontmatter, content } = parseFrontmatter(rawContent);

    // Build ContentSection wrapper with content
    let wrappedContent = `<ContentSection`;

    if (frontmatter.title) {
      wrappedContent += ` title="${frontmatter.title}"`;
    }

    if (frontmatter.description) {
      wrappedContent += ` description="${frontmatter.description}"`;
    }

    wrappedContent += ` url="${doc.routePath}"`;
    wrappedContent += `>\n\n`;
    wrappedContent += content;
    wrappedContent += `\n\n</ContentSection>`;

    return {
      id: generateSectionId(doc.routePath),
      title: frontmatter.title || doc.path,
      description: frontmatter.description,
      url: `${BASE_URL}${doc.routePath}`,
      type: "content",
      content: wrappedContent,
      tokenCount: countTokens(wrappedContent),
    };
  }

  /**
   * Generate header section from directive
   */
  generateHeaderSection(directive: LLMDocDirective): ContentSection {
    const headerContent = `# ${directive.title}

${directive.description}`;

    return {
      id: "header",
      title: directive.title,
      description: directive.description,
      url: `${BASE_URL}/${directive.routePath}`, // Human-readable viewer URL
      type: "header",
      content: headerContent,
      tokenCount: countTokens(headerContent),
    };
  }

  /**
   * Process a directive into a complete LLM document
   */
  async processDirective(directive: LLMDocDirective): Promise<LLMDocument> {
    // Resolve includes to get all docs
    const resolvedDocs = this.resolveIncludes(directive.includes);

    // Check for ID collisions
    const ids = new Set<string>();
    const contentSections: ContentSection[] = [];

    for (const doc of resolvedDocs) {
      const section = this.generateContentSection(doc);

      if (ids.has(section.id)) {
        throw new Error(`ID collision detected: ${section.id} (from ${doc.routePath})`);
      }

      ids.add(section.id);
      contentSections.push(section);
    }

    // Generate header section
    const headerSection = this.generateHeaderSection(directive);

    // Combine all sections
    const allSections = [headerSection, ...contentSections];

    // Calculate total tokens
    const totalTokens = allSections.reduce((sum, section) => sum + section.tokenCount, 0);

    return new LLMDocument(
      {
        title: directive.title,
        description: directive.description,
        routePath: directive.routePath,
        totalTokens,
        generatedAt: new Date().toISOString(),
        sectionsCount: allSections.length,
      },
      allSections
    );
  }

  /**
   * Load the LLM meta file containing all document definitions
   */
  async loadMeta(): Promise<LLMDocMeta> {
    const metaFilePath = path.join(this.docsRoot, "_llms-meta.ts");

    try {
      const module = await import(metaFilePath);
      const meta = module.llmDocuments || module.default;

      if (!meta) {
        throw new Error(`No llmDocuments export found in ${metaFilePath}`);
      }

      return { documents: meta } as LLMDocMeta;
    } catch (error) {
      throw new Error(
        `Failed to load LLM meta file from ${metaFilePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Process all LLM document directives from meta file
   */
  async processAllDocuments(): Promise<LLMDocument[]> {
    const meta = await this.loadMeta();
    const processedDocs: LLMDocument[] = [];

    for (const directive of meta.documents) {
      const document = await this.processDirective(directive);
      processedDocs.push(document);
    }

    return processedDocs;
  }
}
