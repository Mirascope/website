import { ContentError } from "./content";
import remarkGfm from "remark-gfm";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import remarkMdx from "remark-mdx";
import { compile } from "@mdx-js/mdx";
import { rehypeCodeMeta } from "./rehype-code-meta";
import type { TOCItem } from "@/src/components/core/navigation/TableOfContents";
import { extractHeadings } from "@/src/lib/mdx/heading-utils";

import { visit } from "unist-util-visit";
import type { Root, RootContent } from "mdast";
import type { MdxJsxFlowElement, MdxJsxTextElement } from "mdast-util-mdx-jsx";

/**
 * Result of frontmatter parsing
 */
export interface FrontmatterResult {
  frontmatter: Record<string, any>;
  content: string;
}

/**
 * Result of MDX processing
 */
export interface ProcessedContent {
  content: string;
  markdown: string;
  frontmatter: Record<string, any>;
  code: string;
  tableOfContents: TOCItem[];
}

/**
 * Parses frontmatter from document content
 *
 * @param content - The document content with frontmatter
 * @returns An object containing the parsed frontmatter and the cleaned content
 */
export function parseFrontmatter(content: string): FrontmatterResult {
  try {
    // Check for content with frontmatter pattern
    if (!content.startsWith("---")) {
      return {
        frontmatter: {},
        content,
      };
    }

    const parts = content.split("---");

    // Handle case with empty frontmatter (---\n---)
    if (parts.length >= 3 && parts[1].trim() === "") {
      return {
        frontmatter: {},
        content: parts.slice(2).join("---").trimStart(),
      };
    }

    // Normal case with frontmatter content
    if (parts.length >= 3) {
      const frontmatterStr = parts[1].trim();
      const contentParts = parts.slice(2).join("---");
      const cleanContent = contentParts.trimStart();

      // Parse frontmatter into key-value pairs
      const frontmatter: Record<string, any> = {};

      // Split by lines and process each line
      frontmatterStr.split("\n").forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return; // Skip empty lines

        // Look for key: value format
        const colonIndex = trimmedLine.indexOf(":");
        if (colonIndex > 0) {
          const key = trimmedLine.slice(0, colonIndex).trim();
          const value = trimmedLine.slice(colonIndex + 1).trim();

          // Remove quotes if present
          frontmatter[key] = value.replace(/^["'](.*)["']$/, "$1");
        }
      });

      return {
        frontmatter,
        content: cleanContent,
      };
    }

    // If no proper frontmatter found, return original content
    return {
      frontmatter: {},
      content,
    };
  } catch (error) {
    // In case of parsing error, return the original content
    return {
      frontmatter: {},
      content,
    };
  }
}

/**
 * Merges frontmatter from different sources with optional overwriting
 *
 * @param target - The target frontmatter object
 * @param source - The source frontmatter object
 * @param overwrite - Whether to overwrite existing values (default: false)
 * @returns The merged frontmatter
 */
export function mergeFrontmatter(
  target: Record<string, any>,
  source: Record<string, any>,
  overwrite = false
): Record<string, any> {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    // Only add if the key doesn't exist or overwrite is true
    if (overwrite || !(key in result)) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * MDX processing that parses frontmatter and compiles MDX content
 *
 * @param rawContent - Raw content string with frontmatter
 * @param contentType - The type of content being processed
 * @param options - Additional processing options
 * @returns Processed content with frontmatter, content and compiled code
 * @throws ContentError if MDX processing fails
 */
export async function processMDXContent(
  rawContent: string,
  options?: {
    path?: string; // Optional path for better error reporting
  }
): Promise<ProcessedContent> {
  if (!rawContent) {
    throw new ContentError("Empty content provided", options?.path);
  }

  try {
    // Extract frontmatter
    const { frontmatter, content } = parseFrontmatter(rawContent);

    // Get plain markdown from document with MDX
    const markdown = await processMdx(content);

    // Extract table of contents
    const tableOfContents = extractHeadings(content);

    const compiledResult = await compile(content, {
      outputFormat: "function-body",
      providerImportSource: "@mdx-js/react",
      development: process.env.NODE_ENV !== "production",
      remarkPlugins: [remarkGfm],
      rehypePlugins: [rehypeCodeMeta],
    });

    // Return processed content
    return {
      content,
      markdown,
      frontmatter,
      code: String(compiledResult),
      tableOfContents,
    };
  } catch (error) {
    // Throw a ContentError instead of returning an error component
    throw new ContentError(
      `Error processing MDX content: ${error instanceof Error ? error.message : String(error)}`,
      options?.path,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Remark plugin that replaces MDX components with their plain markdown content
 * This converts components like <TabbedSection>, <Callout>, etc. to plain markdown
 */
function remarkReplaceMdxComponents() {
  return (tree: Root) => {
    const calloutComponents = ["Note", "Warning", "Info", "Success", "Callout"];
    const otherComponents = [
      "InstallSnippet",
      "ProviderCodeBlock",
      "MermaidDiagram",
      "ApiType",
      "ApiSignature",
      "AttributesTable",
      "ParametersTable",
      "ReturnTable",
      "TypeLink",
      "Button",
      "ButtonLink",
      "ProductLogo",
      "MirascopeLogo",
      "LilypadLogo",
    ];

    // Collect all nodes to modify, then modify in reverse order to avoid index issues
    // Parent must have a children property (Root, or Content nodes with children)
    type ParentWithChildren = Root | Extract<RootContent, { children: RootContent[] }>;

    interface Modification {
      parent: ParentWithChildren;
      index: number;
      replacement: RootContent[];
    }

    const modifications: Modification[] = [];

    // First pass: handle TabbedSection components, we semantically understand them
    visit(tree, "mdxJsxFlowElement", (node: MdxJsxFlowElement, index, parent) => {
      if (
        node.name === "TabbedSection" &&
        parent &&
        typeof index === "number" &&
        "children" in parent
      ) {
        const tabs: RootContent[] = [];

        // Extract Tab components from children
        if (node.children) {
          for (let i = 0; i < node.children.length; i++) {
            const child = node.children[i];
            if (child.type === "mdxJsxFlowElement" && child.name === "Tab") {
              // Get the value attribute
              const valueAttr = child.attributes?.find(
                (attr) => attr.type === "mdxJsxAttribute" && attr.name === "value"
              );

              if (
                valueAttr &&
                valueAttr.type === "mdxJsxAttribute" &&
                valueAttr.value &&
                typeof valueAttr.value === "string"
              ) {
                const tabValue = valueAttr.value;
                const tabContent = child.children || [];

                if (tabContent.length > 0) {
                  // Create a heading for the tab
                  tabs.push({
                    type: "heading",
                    depth: 3,
                    children: [{ type: "text", value: tabValue }],
                  });

                  // Add the tab content
                  tabs.push(...tabContent);

                  // Add a thematic break (horizontal rule) between tabs (except the last one)
                  if (i < node.children.length - 1) {
                    tabs.push({ type: "thematicBreak" });
                  }
                }
              }
            }
          }
        }

        modifications.push({
          parent: parent as ParentWithChildren,
          index,
          replacement: tabs.length > 0 ? tabs : [],
        });
      }
    });

    // Second pass: handle standalone Tab components (outside TabbedSection)
    visit(tree, "mdxJsxFlowElement", (node: MdxJsxFlowElement, index, parent) => {
      if (node.name === "Tab" && parent && typeof index === "number" && "children" in parent) {
        const valueAttr = node.attributes?.find(
          (attr) => attr.type === "mdxJsxAttribute" && attr.name === "value"
        );

        if (
          valueAttr &&
          valueAttr.type === "mdxJsxAttribute" &&
          valueAttr.value &&
          typeof valueAttr.value === "string"
        ) {
          const tabValue = valueAttr.value;
          const tabContent = node.children || [];

          modifications.push({
            parent: parent as ParentWithChildren,
            index,
            replacement: [
              {
                type: "heading",
                depth: 3,
                children: [{ type: "text", value: tabValue }],
              },
              ...tabContent,
            ],
          });
        } else {
          // Remove Tab without value
          modifications.push({
            parent: parent as ParentWithChildren,
            index,
            replacement: [],
          });
        }
      }
    });

    // Third pass: handle callout components (Note, Warning, Info, Success, Callout)
    visit(tree, "mdxJsxFlowElement", (node: MdxJsxFlowElement, index, parent) => {
      if (
        calloutComponents.includes(node.name || "") &&
        parent &&
        typeof index === "number" &&
        "children" in parent
      ) {
        // Get title attribute
        const titleAttr = node.attributes?.find(
          (attr) => attr.type === "mdxJsxAttribute" && attr.name === "title"
        );

        const title =
          titleAttr && titleAttr.type === "mdxJsxAttribute" && typeof titleAttr.value === "string"
            ? titleAttr.value
            : null;

        const content = node.children || [];
        const replacement: RootContent[] = [];

        // Add title as strong text if present
        if (title) {
          replacement.push({
            type: "paragraph",
            children: [
              {
                type: "strong",
                children: [{ type: "text", value: title }],
              },
            ],
          });
        }

        // Add the content
        replacement.push(...content);

        modifications.push({
          parent: parent as ParentWithChildren,
          index,
          replacement,
        });
      }
    });

    // Fourth pass: just extract content from any other components that we don't semantically understand
    visit(tree, "mdxJsxFlowElement", (node: MdxJsxFlowElement, index, parent) => {
      if (
        otherComponents.includes(node.name || "") &&
        parent &&
        typeof index === "number" &&
        "children" in parent
      ) {
        modifications.push({
          parent: parent as ParentWithChildren,
          index,
          replacement: node.children && node.children.length > 0 ? [...node.children] : [],
        });
      }
    });

    visit(tree, "mdxJsxTextElement", (node: MdxJsxTextElement, index, parent) => {
      if (
        otherComponents.includes(node.name || "") &&
        parent &&
        typeof index === "number" &&
        "children" in parent
      ) {
        modifications.push({
          parent: parent as ParentWithChildren,
          index,
          replacement: node.children && node.children.length > 0 ? [...node.children] : [],
        });
      }
    });

    // Fifth pass: remove any remaining JSX-like elements (generic cleanup)
    visit(tree, "mdxJsxFlowElement", (node: MdxJsxFlowElement, index, parent) => {
      if (
        node.name &&
        !calloutComponents.includes(node.name) &&
        !otherComponents.includes(node.name) &&
        node.name !== "TabbedSection" &&
        node.name !== "Tab" &&
        /^[A-Z]/.test(node.name) &&
        parent &&
        typeof index === "number" &&
        "children" in parent
      ) {
        modifications.push({
          parent: parent as ParentWithChildren,
          index,
          replacement: node.children && node.children.length > 0 ? [...node.children] : [],
        });
      }
    });

    // Remove self-closing JSX elements
    visit(tree, "mdxJsxFlowElement", (node: MdxJsxFlowElement, index, parent) => {
      if (
        (!node.children || node.children.length === 0) &&
        node.name &&
        !calloutComponents.includes(node.name) &&
        !otherComponents.includes(node.name) &&
        node.name !== "TabbedSection" &&
        node.name !== "Tab" &&
        /^[A-Z]/.test(node.name) &&
        parent &&
        typeof index === "number" &&
        "children" in parent
      ) {
        modifications.push({
          parent: parent as ParentWithChildren,
          index,
          replacement: [],
        });
      }
    });

    visit(tree, "mdxJsxTextElement", (node: MdxJsxTextElement, index, parent) => {
      if (
        (!node.children || node.children.length === 0) &&
        node.name &&
        !otherComponents.includes(node.name) &&
        /^[A-Z]/.test(node.name) &&
        parent &&
        typeof index === "number" &&
        "children" in parent
      ) {
        modifications.push({
          parent: parent as ParentWithChildren,
          index,
          replacement: [],
        });
      }
    });

    // Apply modifications in reverse order to avoid index shifting issues
    modifications.sort((a, b) => {
      // Sort by parent first, then by index descending
      if (a.parent !== b.parent) {
        return 0; // Keep order if different parents
      }
      return b.index - a.index; // Descending order
    });

    // Group by parent to handle multiple modifications to the same parent
    const modificationsByParent = new Map<ParentWithChildren, Modification[]>();
    for (const mod of modifications) {
      if (!modificationsByParent.has(mod.parent)) {
        modificationsByParent.set(mod.parent, []);
      }
      modificationsByParent.get(mod.parent)!.push(mod);
    }

    // Apply modifications grouped by parent
    for (const [parent, mods] of modificationsByParent.entries()) {
      // Sort by index descending within each parent
      mods.sort((a, b) => b.index - a.index);

      for (const mod of mods) {
        if (mod.replacement.length > 0) {
          parent.children.splice(mod.index, 1, ...mod.replacement);
        } else {
          parent.children.splice(mod.index, 1);
        }
      }
    }
  };
}

/**
 * Processes markdown content through a remark pipeline with MDX support.
 *
 * This function first parses the MDX to obtain JSX nodes in the AST,
 * then transforms them, and finally stringifies the result to get plain markdown.
 */
export async function processMdx(fullContent: string): Promise<string> {
  const plain = await unified()
    .use(remarkParse)
    .use(remarkMdx) // Enable MDX JSX parsing
    .use(remarkReplaceMdxComponents) // Transform MDX components to plain markdown
    .use(remarkGfm)
    .use(remarkStringify)
    .process(fullContent);

  return String(plain);
}
