/**
 * Template Processing System
 * 
 * Handles processing of MDX template files in content/llms/ that use {{include}} directives
 * to concatenate other documentation content.

* 
 * Example transformation:
 * 
 * BEFORE (template file):
 * ```
 * ---
 * title: "Complete Documentation"
 * description: "All docs in one place"
 * template: true
 * order: 1
 * ---
 * 
 * # Complete Documentation
 * 
 * ## Getting Started
 * {{include routes=["mirascope/index.mdx", "mirascope/guides/getting-started/quickstart.mdx"]}}
 * 
 * ## Learning Mirascope
 * {{include routes=["mirascope/learn/*.mdx"]}}
 * ```
 * 
 * AFTER (processed output):
 * ```
 * # Complete Documentation
 * 
 * ## Getting Started
 * <ContentSection title="Mirascope" description="Mirascope is a Python library..." url="/docs/mirascope/">
 * 
 * # Mirascope 
 * 
 * <div className="badge-container">...
 * 
 * </ContentSection>
 * 
 * <ContentSection title="Quickstart" description="Get started with Mirascope..." url="/docs/mirascope/guides/getting-started/quickstart">
 * 
 * # Quickstart
 * 
 * Mirascope supports various LLM providers...
 * 
 * </ContentSection>
 * 
 * ## Learning Mirascope
 * <ContentSection title="Calls" description="Learn how to make API calls..." url="/docs/mirascope/learn/calls">
 * 
 * # Calls
 * 
 * When working with Large Language Model (LLM) APIs...
 * 
 * </ContentSection>
 * ```
 */

import fs from "fs";
import path from "path";
import { getAllDocInfo } from "./content";
import { parseFrontmatter } from "./mdx-processing";
import type { DocInfo } from "./spec";

/**
 * Template metadata extracted from frontmatter
 */
export interface TemplateMetadata {
  order?: number; // Optional ordering; Lower numbers come first. Defaults to 7
  title: string;
  description: string;
  isTemplate: true; // Must be exactly true to discriminate templates
}

const DEFAULT_ORDER = 7;

/**
 * Template file information
 */
export interface TemplateFile {
  filePath: string;
  slug: string;
  metadata: TemplateMetadata;
  content: string;
}

/**
 * Include directive parsed from template content
 */
export interface IncludeDirective {
  fullMatch: string;
  routes: string[];
}

/**
 * Template processor with configurable directories
 */
export class TemplateProcessor {
  private readonly templatesDir: string;
  private readonly docsRoot: string;

  constructor(templatesDir?: string, docsRoot?: string) {
    this.templatesDir = templatesDir || path.join(process.cwd(), "content", "llms");
    this.docsRoot = docsRoot || path.join(process.cwd(), "content", "docs");
  }

  /**
   * Find all template files in the templates directory
   */
  findTemplateFiles(): TemplateFile[] {
    if (!fs.existsSync(this.templatesDir)) {
      throw new Error(`Templates directory not found: ${this.templatesDir}`);
    }

    const templateFiles: TemplateFile[] = [];
    const files = fs.readdirSync(this.templatesDir);

    for (const file of files) {
      if (file.endsWith(".mdx")) {
        const filePath = path.join(this.templatesDir, file);
        const rawContent = fs.readFileSync(filePath, "utf-8");
        const { frontmatter, content } = parseFrontmatter(rawContent);

        const slug = file.replace(".mdx", "");

        // Validate required fields
        if (!frontmatter.title) {
          throw new Error(`Template ${file} is missing required field: title`);
        }
        if (!frontmatter.description) {
          throw new Error(`Template ${file} is missing required field: description`);
        }

        const metadata: TemplateMetadata = {
          order: frontmatter.order,
          title: frontmatter.title,
          description: frontmatter.description,
          isTemplate: true,
        };
        templateFiles.push({
          filePath,
          slug,
          metadata,
          content,
        });
      }
    }

    // Sort by order (undefined order defaults to 999)
    templateFiles.sort((a, b) => {
      const orderA = a.metadata.order ?? DEFAULT_ORDER;
      const orderB = b.metadata.order ?? DEFAULT_ORDER;
      return orderA - orderB;
    });

    return templateFiles;
  }

  /**
   * Parse include directives from template content
   */
  parseIncludeDirectives(content: string): IncludeDirective[] {
    const includePattern = /\{\{include\s+routes=\[(.*?)\](?:\s+([^}]*))?\}\}/g;
    const directives: IncludeDirective[] = [];

    let match;
    while ((match = includePattern.exec(content)) !== null) {
      const routesStr = match[1];

      // Parse route patterns
      const routes = routesStr.split(",").map((r) => r.trim().replace(/['"]/g, ""));

      directives.push({
        fullMatch: match[0],
        routes,
      });
    }

    return directives;
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
   * Process a template file by replacing include directives with actual content
   */
  processTemplate(template: TemplateFile): string {
    const directives = this.parseIncludeDirectives(template.content);
    const allDocs = getAllDocInfo();
    let processedContent = template.content;

    for (const directive of directives) {
      const filteredDocs = filterDocsByRoutes(allDocs, directive.routes);
      const includedContent = this.generateIncludedContent(filteredDocs);

      processedContent = processedContent.replace(directive.fullMatch, includedContent);
    }

    return processedContent;
  }

  /**
   * Generate all template files to specified output directory
   */
  generateTemplates(outputDir: string): TemplateFile[] {
    const templates = this.findTemplateFiles();
    console.log(`Found ${templates.length} template files.`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const template of templates) {
      const processedContent = this.processTemplate(template);
      const outputPath = path.join(outputDir, `${template.slug}.mdx`);

      fs.writeFileSync(outputPath, processedContent, "utf-8");
      console.log(`Generated: ${outputPath} (${processedContent.length} characters)`);
    }

    return templates;
  }

  /**
   * Get template metadata without processing
   */
  getTemplates(): TemplateFile[] {
    return this.findTemplateFiles();
  }
}

/**
 * Filter docs based on route patterns
 */
export function filterDocsByRoutes(docs: DocInfo[], routePatterns: string[]): DocInfo[] {
  const filtered: DocInfo[] = [];

  // Process each route pattern in order
  for (const pattern of routePatterns) {
    const matchingDocs = docs.filter((doc) => matchesRoutePattern(doc.path, pattern));

    // Add matching docs in the order they appear in getAllDocInfo
    for (const doc of matchingDocs) {
      // Avoid duplicates
      if (!filtered.some((d) => d.path === doc.path)) {
        filtered.push(doc);
      }
    }
  }

  return filtered;
}

/**
 * Check if a doc path matches a route pattern
 */
export function matchesRoutePattern(docPath: string, pattern: string): boolean {
  // Remove leading/trailing slashes and normalize
  const normalizedPath = docPath.replace(/^\/+|\/+$/g, "");
  const normalizedPattern = pattern.replace(/^\/+|\/+$/g, "");

  if (normalizedPattern.endsWith("/*.mdx")) {
    // Pattern for direct files only (no subdirectories)
    const prefix = normalizedPattern.slice(0, -6); // Remove "/*.mdx"

    if (!normalizedPath.startsWith(prefix)) {
      return false;
    }

    const remainder = normalizedPath.slice(prefix.length);
    return remainder.startsWith("/") && !remainder.slice(1).includes("/");
  } else if (normalizedPattern.endsWith("/*")) {
    // Pattern with wildcard: check if path starts with the prefix (includes subdirectories)
    const prefix = normalizedPattern.slice(0, -2); // Remove "/*"
    return normalizedPath.startsWith(prefix);
  } else {
    // Exact match
    return normalizedPath === normalizedPattern;
  }
}
