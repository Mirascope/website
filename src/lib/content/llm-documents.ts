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
import type { DocInfo } from "./spec";
import meta from "@/content/llms/_llms-meta";
import type { LLMDocDirective, IncludeDirective, SectionDirective } from "./llm-directives";
/* ========== CORE TYPES =========== */

/**
 * Shared interface for content items that can be copied and displayed with token counts
 */
export interface ContentItem {
  title: string;
  description?: string;
  routePath: string;
  tokenCount: number;
  getContent(): string;
}

/**
 * Individual document included in processed LLM document
 */
export interface IncludedDocument extends ContentItem {
  id: string; // "docs-mirascope-learn-calls" etc
  content: string; // includes <ContentSection> wrapper for content sections
  getContent(): string;
}

/**
 * Container that aggregates child content items (can be documents or other containers)
 */
export interface ContentContainer extends ContentItem {
  children: ContentItem[];
  metadata?: {
    totalTokens: number;
    generatedAt: string;
    sectionsCount: number;
  };
  generateToC?: boolean;
  getContent(): string;
}

/**
 * Content item in an LLM document - either a standalone document or a container with children
 */
export type LLMContent = IncludedDocument | ContentContainer;

/**
 * Complete processed LLM document - now just a ContentContainer with extra metadata
 */
export class LLMDocument implements ContentContainer {
  public title: string;
  public description: string;
  public routePath: string;
  public tokenCount: number;
  public children: LLMContent[];
  public generateToC: boolean = true;
  public metadata: {
    totalTokens: number;
    generatedAt: string;
    sectionsCount: number;
  };

  constructor(
    title: string,
    description: string,
    routePath: string,
    tokenCount: number,
    children: LLMContent[],
    metadata: { generatedAt: string; sectionsCount: number }
  ) {
    this.title = title;
    this.description = description;
    this.routePath = routePath;
    this.tokenCount = tokenCount;
    this.children = children;
    this.metadata = {
      ...metadata,
      totalTokens: tokenCount,
    };
  }

  getContent(): string {
    return this.children.map((item) => item.getContent()).join("\n\n");
  }

  /**
   * Serialize to JSON for viewer consumption
   */
  toJSON(): object {
    return {
      title: this.title,
      description: this.description,
      routePath: this.routePath,
      tokenCount: this.tokenCount,
      children: this.children,
      generateToC: this.generateToC,
      metadata: this.metadata,
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: any): LLMDocument {
    // Reconstruct content items with proper methods
    const children: LLMContent[] = data.children.map((item: any) => {
      if ("content" in item) {
        // IncludedDocument - add getContent method
        return {
          ...item,
          getContent: () => item.content,
        } as IncludedDocument;
      } else {
        // ContentContainer - add getContent method
        const childItems = item.children.map((doc: any) => ({
          ...doc,
          getContent: () => doc.content,
        }));
        return {
          ...item,
          children: childItems,
          getContent: () => childItems.map((child: ContentItem) => child.getContent()).join("\n\n"),
        } as ContentContainer;
      }
    });

    return new LLMDocument(
      data.title,
      data.description,
      data.routePath,
      data.tokenCount,
      children,
      data.metadata
    );
  }
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
      routePath: doc.routePath,
      content: wrappedContent,
      tokenCount: countTokens(wrappedContent),
      getContent: () => wrappedContent,
    };
  }

  /**
   * Generate human-readable table of contents from section directives and included documents
   */
  generateTableOfContents(
    sectionDirectives: SectionDirective[],
    includedDocsBySection: Map<string, IncludedDocument[]>
  ): string {
    let toc = "# Table of Contents\n\n";

    for (const sectionDirective of sectionDirectives) {
      // Section title with description
      toc += `# ${sectionDirective.title}`;
      if (sectionDirective.description) {
        toc += ` - ${sectionDirective.description}`;
      }
      toc += "\n\n";

      // Add included documents under this section
      const docs = includedDocsBySection.get(sectionDirective.title) || [];
      for (const doc of docs) {
        toc += `## ${doc.title}`;
        if (doc.description) {
          toc += `\n- ${doc.description}`;
        }
        toc += "\n\n";
      }

      toc += "\n";
    }

    return toc.trim();
  }

  /**
   * Generate header section from directive and included documents
   */
  generateHeaderSection(
    directive: LLMDocDirective,
    sectionDirectives: SectionDirective[],
    includedDocsBySection: Map<string, IncludedDocument[]>
  ): IncludedDocument {
    const toc = this.generateTableOfContents(sectionDirectives, includedDocsBySection);
    const headerContent = `# ${directive.title}

${directive.description}

${toc}`;

    return {
      id: "header",
      title: "Table of Contents",
      description: directive.description,
      routePath: `/${directive.routePath}`, // Human-readable viewer URL
      content: headerContent,
      tokenCount: countTokens(headerContent),
      getContent: () => headerContent,
    };
  }

  /**
   * Process a directive into a complete LLM document
   */
  async processDirective(directive: LLMDocDirective): Promise<LLMDocument> {
    // Process each section directive
    const ids = new Set<string>();
    const content: LLMContent[] = [];
    const includedDocsBySection = new Map<string, IncludedDocument[]>();

    // Process regular sections first
    for (const sectionDirective of directive.sections) {
      const resolvedDocs = this.resolveIncludes(sectionDirective.includes);
      const sectionDocs: IncludedDocument[] = [];

      for (const doc of resolvedDocs) {
        const includedDoc = this.generateIncludedDocument(doc);

        if (ids.has(includedDoc.id)) {
          throw new Error(`ID collision detected: ${includedDoc.id} (from ${doc.routePath})`);
        }

        ids.add(includedDoc.id);
        sectionDocs.push(includedDoc);
      }

      includedDocsBySection.set(sectionDirective.title, sectionDocs);
    }

    // Now generate header section with complete TOC
    const headerDoc = this.generateHeaderSection(
      directive,
      directive.sections,
      includedDocsBySection
    );

    // Build content array: TOC document first, then sections with their documents
    content.push(headerDoc);

    for (const sectionDirective of directive.sections) {
      const sectionDocs = includedDocsBySection.get(sectionDirective.title) || [];
      const sectionTokenCount = sectionDocs.reduce((sum, doc) => sum + doc.tokenCount, 0);
      const contentSection: ContentContainer = {
        title: sectionDirective.title,
        description: sectionDirective.description,
        routePath:
          sectionDirective.routePath ||
          `#${sectionDirective.title.toLowerCase().replace(/\s+/g, "-")}`,
        children: sectionDocs,
        tokenCount: sectionTokenCount,
        generateToC: false, // Sections don't generate their own ToC
        getContent: () => sectionDocs.map((doc) => doc.getContent()).join("\n\n"),
      };
      content.push(contentSection);
    }

    // Calculate total tokens from all documents
    const allDocs = [headerDoc, ...Array.from(includedDocsBySection.values()).flat()];
    const totalTokens = allDocs.reduce((sum, doc) => sum + doc.tokenCount, 0);

    return new LLMDocument(
      directive.title,
      directive.description,
      directive.routePath,
      totalTokens,
      content,
      {
        generatedAt: new Date().toISOString(),
        sectionsCount: allDocs.length,
      }
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
