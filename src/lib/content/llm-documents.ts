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
 * - Maintains ordering from _meta.ts files
 * - Outputs both .txt files for LLM consumption and data for human viewers
 */

import fs from "fs";
import path from "path";
import { getAllDocInfo } from "./content";
import { parseFrontmatter } from "./mdx-processing";
import type { DocInfo } from "./spec";

/* ========== CORE TYPES =========== */

/**
 * Content inclusion directive types
 */
export type IncludeType = "exact" | "glob" | "wildcard";

/**
 * LLM Meta file structure - central registry for all LLM documents
 */
export interface LLMDocMeta {
  documents: Array<{
    template: LLMDocTemplate;
    routePath: string; // Where this document should be available (e.g., "mirascope/llms-full")
  }>;
}

/**
 * Include directive for referencing content to aggregate
 */
export interface IncludeDirective {
  type: IncludeType;
  pattern: string;
}

/**
 * Section within an LLM document
 */
export interface LLMDocSection {
  title: string; // Section heading
  content?: string; // Optional intro content for the section
  includes: IncludeDirective[]; // Content to aggregate
}

/**
 * Complete LLM document definition
 */
export interface LLMDocTemplate {
  metadata: {
    slug: string; // URL slug (becomes filename)
    title: string; // Human-readable title
    description: string; // Document description
  };

  sections: LLMDocSection[];
}

/**
 * Processed LLM document file information
 */
export interface LLMDocument {
  slug: string;
  routePath: string; // Route path for this document (e.g., "mirascope/llms-full")
  metadata: LLMDocTemplate["metadata"];
  content: string; // Final processed MDX content
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
 * Define an LLM document template with type safety and validation
 */
export function defineLLMDocTemplate(doc: LLMDocTemplate): LLMDocTemplate {
  // Basic validation
  if (!doc.metadata.slug) {
    throw new Error("LLM document must have a slug");
  }
  if (!doc.metadata.title) {
    throw new Error("LLM document must have a title");
  }
  if (!doc.metadata.description) {
    throw new Error("LLM document must have a description");
  }
  if (!doc.sections || doc.sections.length === 0) {
    throw new Error("LLM document must have at least one section");
  }

  return doc;
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
   * Generate content for included docs using ContentSection components
   */
  generateIncludedContent(docs: DocInfo[]): string {
    const sections: string[] = [];

    for (const doc of docs) {
      const filePath = path.join(this.docsRoot, `${doc.path}.mdx`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Required doc file not found: ${filePath}`);
      }

      const rawContent = fs.readFileSync(filePath, "utf-8");
      const { frontmatter, content } = parseFrontmatter(rawContent);

      // Wrap content in ContentSection component
      let section = `<ContentSection`;

      if (frontmatter.title) {
        section += ` title="${frontmatter.title}"`;
      }

      if (frontmatter.description) {
        section += ` description="${frontmatter.description}"`;
      }

      // Add the doc's route URL
      section += ` url="${doc.routePath}"`;
      section += `>\n\n`;

      // Add the actual content
      section += content;
      section += `\n\n</ContentSection>`;

      sections.push(section);
    }

    return sections.join("\n\n");
  }

  /**
   * Load an LLM document by processing a template
   */
  async loadTemplate(template: LLMDocTemplate): Promise<string> {
    let processedContent = "";

    // Add document title and description
    processedContent += `# ${template.metadata.title}\n\n`;
    processedContent += `${template.metadata.description}\n\n`;

    // Process each section
    for (const section of template.sections) {
      // Add section title
      processedContent += `## ${section.title}\n\n`;

      // Add optional section content
      if (section.content) {
        processedContent += `${section.content.trim()}\n\n`;
      }

      // Resolve and include content
      const resolvedDocs = this.resolveIncludes(section.includes);
      if (resolvedDocs.length > 0) {
        const includedContent = this.generateIncludedContent(resolvedDocs);
        processedContent += `${includedContent}\n\n`;
      }

      // Add section separator
      processedContent += "---\n\n";
    }

    // Remove trailing separator
    processedContent = processedContent.replace(/---\n\n$/, "");

    return processedContent;
  }

  /**
   * Process all LLM document templates into LLMDocument objects
   */
  async processAllTemplates(): Promise<LLMDocument[]> {
    const meta = await this.loadMeta();
    const processedDocs: LLMDocument[] = [];

    for (const { template, routePath } of meta.documents) {
      const content = await this.loadTemplate(template);

      processedDocs.push({
        slug: template.metadata.slug,
        routePath,
        metadata: template.metadata,
        content,
      });
    }

    return processedDocs;
  }

  /**
   * Write LLM documents to disk as .txt files
   */
  writeToDisk(documents: LLMDocument[], outputDir: string): void {
    for (const doc of documents) {
      const outputPath = path.join(outputDir, `${doc.routePath}.txt`);
      const outputDirPath = path.dirname(outputPath);

      fs.mkdirSync(outputDirPath, { recursive: true });
      fs.writeFileSync(outputPath, doc.content, "utf-8");

      console.log(`Generated: ${outputPath} (${doc.content.length} characters)`);
    }
  }

  /**
   * Generate all LLM documents to specified output directory
   */
  async generateLLMDocuments(outputDir: string): Promise<LLMDocument[]> {
    const documents = await this.processAllTemplates();
    this.writeToDisk(documents, outputDir);
    return documents;
  }
}
