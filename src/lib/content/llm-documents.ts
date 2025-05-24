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
import meta from "@/content/llms/_llms-meta";
import type { LLMDocDirective, IncludeDirective, ContentSection } from "./llm-directives";
/* ========== CORE TYPES =========== */

/**
 * Individual document included in processed LLM document
 */
export interface IncludedDocument {
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
  public sections: IncludedDocument[];
  public contentSections: ContentSection[];
  public sectionMap: Map<string, IncludedDocument[]>;

  constructor(
    metadata: LLMDocument["metadata"],
    sections: IncludedDocument[],
    contentSections: ContentSection[] = [],
    sectionMap: Map<string, IncludedDocument[]> = new Map()
  ) {
    this.metadata = metadata;
    this.sections = sections;
    this.contentSections = contentSections;
    this.sectionMap = sectionMap;
  }

  /**
   * Serialize to JSON for viewer consumption
   */
  toJSON(): object {
    return {
      metadata: this.metadata,
      sections: this.sections,
      contentSections: this.contentSections,
      sectionMap: Object.fromEntries(this.sectionMap),
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: any): LLMDocument {
    const sectionMap = new Map<string, IncludedDocument[]>(Object.entries(data.sectionMap || {}));
    return new LLMDocument(data.metadata, data.sections, data.contentSections || [], sectionMap);
  }

  /**
   * Generate .txt file content
   */
  toString(): string {
    return this.sections.map((section) => section.content).join("\n\n");
  }
}

/* ========== DSL HELPERS =========== */

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
   * Generate included document from a doc
   */
  generateIncludedDocument(doc: DocInfo): IncludedDocument {
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
   * Generate table of contents XML from content sections and included documents
   */
  generateTableOfContents(
    contentSections: ContentSection[],
    includedDocsBySection: Map<string, IncludedDocument[]>
  ): string {
    let xml = "<table_of_contents>\n";

    for (const contentSection of contentSections) {
      xml += `  <section title="${contentSection.title}" level="1"`;
      if (contentSection.description) {
        xml += ` description="${contentSection.description}"`;
      }
      xml += `>\n`;

      // Add included documents under this content section
      const docs = includedDocsBySection.get(contentSection.title) || [];
      for (const doc of docs) {
        xml += `    <document title="${doc.title}" id="${doc.id}" level="2"`;
        if (doc.description) {
          xml += ` description="${doc.description}"`;
        }
        xml += ` />\n`;
      }

      xml += `  </section>\n`;
    }

    xml += "</table_of_contents>";
    return xml;
  }

  /**
   * Generate header section from directive and included documents
   */
  generateHeaderSection(
    directive: LLMDocDirective,
    contentSections: ContentSection[],
    includedDocsBySection: Map<string, IncludedDocument[]>
  ): IncludedDocument {
    const toc = this.generateTableOfContents(contentSections, includedDocsBySection);
    const headerContent = `# ${directive.title}

${directive.description}

${toc}`;

    return {
      id: "header",
      title: "Table of Contents",
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
    // Process each content section
    const ids = new Set<string>();
    const allIncludedDocs: IncludedDocument[] = [];
    const includedDocsBySection = new Map<string, IncludedDocument[]>();

    for (const contentSection of directive.sections) {
      // Resolve includes for this content section
      const resolvedDocs = this.resolveIncludes(contentSection.includes);
      const sectionDocs: IncludedDocument[] = [];

      for (const doc of resolvedDocs) {
        const includedDoc = this.generateIncludedDocument(doc);

        if (ids.has(includedDoc.id)) {
          throw new Error(`ID collision detected: ${includedDoc.id} (from ${doc.routePath})`);
        }

        ids.add(includedDoc.id);
        sectionDocs.push(includedDoc);
        allIncludedDocs.push(includedDoc);
      }

      includedDocsBySection.set(contentSection.title, sectionDocs);
    }

    // Generate header section with hierarchical table of contents
    const headerSection = this.generateHeaderSection(
      directive,
      directive.sections,
      includedDocsBySection
    );

    // Combine all sections
    const allSections = [headerSection, ...allIncludedDocs];

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
      allSections,
      directive.sections,
      includedDocsBySection
    );
  }

  /**
   * Process all LLM document directives from meta file
   */
  async processAllDocuments(): Promise<LLMDocument[]> {
    const processedDocs: LLMDocument[] = [];

    for (const directive of meta.documents) {
      const document = await this.processDirective(directive);
      processedDocs.push(document);
    }

    return processedDocs;
  }
}
