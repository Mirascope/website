/**
 * Unified LLM Content System
 *
 * A unified class-based approach for representing and composing LLM documentation.
 * Replaces the previous ContentItem/ContentContainer/LLMDocument hierarchy with
 * a single flexible class that can represent both leaf content and composed structures.
 */

export type Slug = string;

/**
 * Accurate token counting using js-tiktoken (build-time only)
 */
function countTokens(text: string): number {
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

/**
 * Validates that a slug contains no slashes and is URL-friendly
 */
function validateSlug(slug: Slug): void {
  if (slug.includes("/")) {
    throw new Error(`Slug cannot contain slashes: ${slug}`);
  }
  if (slug !== encodeURIComponent(slug)) {
    throw new Error(`Slug must be URL-friendly: ${slug}`);
  }
  if (!slug.trim()) {
    throw new Error("Slug cannot be empty");
  }
}

/**
 * Validates that all children have unique slugs within their parent
 */
function validateUniqueChildSlugs(children: ReadonlyArray<LLMContent>): void {
  const slugs = new Set<string>();
  for (const child of children) {
    if (slugs.has(child.slug)) {
      throw new Error(`Duplicate child slug: ${child.slug}`);
    }
    slugs.add(child.slug);
  }
}

/**
 * Unified content representation for LLM documentation.
 * Can represent both leaf content (documents) and composed structures (collections).
 * Supports having both direct content and children for preamble use cases.
 */
export class LLMContent {
  public readonly slug: Slug;
  public readonly title: string;
  public readonly description?: string;
  public readonly route?: string;
  public readonly tokenCount: number;
  private readonly rawContent?: string;
  private readonly children?: ReadonlyArray<LLMContent>;

  private constructor(params: {
    slug: Slug;
    title: string;
    tokenCount: number;
    description?: string;
    route?: string;
    rawContent?: string;
    children?: ReadonlyArray<LLMContent>;
  }) {
    this.slug = params.slug;
    this.title = params.title;
    this.description = params.description;
    this.route = params.route;
    this.tokenCount = params.tokenCount;
    this.rawContent = params.rawContent;
    this.children = params.children;
  }

  /**
   * Create LLMContent from raw text content
   */
  static fromRawContent(params: {
    slug: Slug;
    title: string;
    description?: string;
    content: string;
    route?: string;
  }): LLMContent {
    validateSlug(params.slug);

    const tokenCount = countTokens(params.content);

    return new LLMContent({
      slug: params.slug,
      title: params.title,
      tokenCount,
      description: params.description,
      route: params.route,
      rawContent: params.content,
      children: undefined,
    });
  }

  /**
   * Create LLMContent from child content items
   */
  static fromChildren(params: {
    slug: Slug;
    title: string;
    description?: string;
    children: ReadonlyArray<LLMContent>;
    route?: string;
    preamble?: string;
  }): LLMContent {
    validateSlug(params.slug);
    validateUniqueChildSlugs(params.children);

    // Calculate total token count from children and optional preamble
    const childrenTokens = params.children.reduce((sum, child) => sum + child.tokenCount, 0);
    const preambleTokens = params.preamble ? countTokens(params.preamble) : 0;
    const totalTokens = childrenTokens + preambleTokens;

    return new LLMContent({
      slug: params.slug,
      title: params.title,
      tokenCount: totalTokens,
      description: params.description,
      route: params.route,
      rawContent: params.preamble,
      children: params.children,
    });
  }

  /**
   * Get the complete content as a string.
   * For leaf content: returns the raw content.
   * For composed content: returns preamble (if any) followed by children content.
   */
  getContent(): string {
    const parts: string[] = [];

    // Add preamble content if present
    if (this.rawContent) {
      parts.push(this.rawContent);
    }

    // Add children content if present
    if (this.children && this.children.length > 0) {
      const childrenContent = this.children.map((child) => child.getContent()).join("\n\n");
      parts.push(childrenContent);
    }

    return parts.join("\n\n");
  }

  /**
   * Check if this is a leaf content item (has raw content, no children)
   */
  isLeaf(): boolean {
    return Boolean(this.rawContent && (!this.children || this.children.length === 0));
  }

  /**
   * Check if this is a container (has children)
   */
  isContainer(): boolean {
    return Boolean(this.children && this.children.length > 0);
  }

  /**
   * Check if this has both content and children (preamble case)
   */
  hasPreamble(): boolean {
    return Boolean(this.rawContent && this.children && this.children.length > 0);
  }

  /**
   * Get all child items (empty array if no children)
   */
  getChildren(): ReadonlyArray<LLMContent> {
    return this.children || [];
  }

  /**
   * Serialize to JSON for build output
   */
  toJSON(): object {
    return {
      slug: this.slug,
      title: this.title,
      description: this.description,
      route: this.route,
      tokenCount: this.tokenCount,
      rawContent: this.rawContent,
      children: this.children?.map((child) => child.toJSON()),
    };
  }

  /**
   * Deserialize from JSON (for frontend consumption)
   */
  static fromJSON(data: any): LLMContent {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid JSON data for LLMContent");
    }

    const children = data.children?.map((childData: any) => LLMContent.fromJSON(childData));

    return new LLMContent({
      slug: data.slug,
      title: data.title,
      tokenCount: data.tokenCount,
      description: data.description,
      route: data.route,
      rawContent: data.rawContent,
      children,
    });
  }
}

/**
 * Table of Contents Generation Functions
 */

/**
 * Generate a table of contents from a LLMContent structure
 * Recursively walks the content tree and builds a hierarchical ToC
 */
export function generateTableOfContents(content: LLMContent): string {
  let toc = "# Table of Contents\n\n";

  // Add sections for each child
  for (const child of content.getChildren()) {
    toc += `# ${child.title}`;
    if (child.description) {
      toc += ` - ${child.description}`;
    }
    toc += "\n\n";

    // Add subsections for nested children
    for (const grandchild of child.getChildren()) {
      toc += `## ${grandchild.title}`;
      if (grandchild.description) {
        toc += `\n- ${grandchild.description}`;
      }
      toc += "\n\n";
    }

    toc += "\n";
  }

  return toc.trim();
}

/**
 * Create a table of contents LLMContent item for a given content structure
 */
export function createTableOfContents(content: LLMContent): LLMContent {
  const tocContent = generateTableOfContents(content);

  return LLMContent.fromRawContent({
    slug: "table-of-contents",
    title: "Table of Contents",
    content: tocContent,
  });
}

/**
 * Add a table of contents as the first child of a LLMContent structure
 * Returns a new LLMContent with ToC prepended to children
 */
export function withTableOfContents(content: LLMContent): LLMContent {
  const toc = createTableOfContents(content);
  const newChildren = [toc, ...content.getChildren()];

  return LLMContent.fromChildren({
    slug: content.slug,
    title: content.title,
    description: content.description,
    children: newChildren,
    route: content.route,
  });
}
