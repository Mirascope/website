import React from "react";
import type { TOCItem } from "@/src/components/core/navigation/TableOfContents";
import { slugify } from "@/src/lib/utils";

/**
 * Pattern to match Markdown headings with optional explicit IDs
 * Captures:
 * - Group 1: The heading level (number of # characters)
 * - Group 2: The heading text content
 * - Group 3: Optional explicit ID from {#id} syntax
 */
const HEADING_PATTERN = /^(#{1,6})\s+(.+?)(?:\s+\{#([a-zA-Z0-9_-]+)\})?$/;

/**
 * Pattern to match ApiType component tags
 * Captures the type name from the type attribute
 */
const API_TYPE_PATTERN = /<ApiType\s+type="([^"]+)"[^>]*?\/>/;

/**
 * Generates a slug ID from React children
 * Handles ApiType components and other complex children
 *
 * @param children - React children to generate ID from
 * @returns A URL-friendly slug ID or undefined if no valid text content
 */
export function idSlugFromChildren(children: React.ReactNode): string | undefined {
  const textContent = extractTextFromReactChildren(children);
  return textContent ? slugify(textContent) : undefined;
}

/**
 * Extracts plain text content from React children, handling ApiType components
 * Used for generating heading IDs from React component trees
 *
 * @param children - React children that may include ApiType components
 * @returns Plain text content with ApiType components removed
 */
export function extractTextFromReactChildren(children: React.ReactNode): string {
  let textContent = "";

  if (typeof children === "string") {
    textContent = children;
  } else if (Array.isArray(children)) {
    // For complex children (like when ApiType is used), flatten and extract text
    textContent = React.Children.toArray(children)
      .map((child) => {
        if (typeof child === "string") return child;

        // Skip ApiType components in slug generation
        if (React.isValidElement(child)) {
          // Check the component name
          const componentName = getComponentName(child.type);
          if (componentName === "ApiType") return "";

          // For other elements, try to extract their text children
          const props = child.props as { children?: React.ReactNode };
          if (typeof props.children === "string") {
            return props.children;
          } else if (props.children) {
            // Recursive extraction for nested children
            return extractTextFromReactChildren(props.children);
          }
        }
        return "";
      })
      .join("")
      .trim();
  } else if (React.isValidElement(children)) {
    // Handle React element children
    const props = children.props as { children?: React.ReactNode };
    if (typeof props.children === "string") {
      // Handle single React element with string children
      textContent = props.children;
    } else if (props.children) {
      // Recursive extraction for nested children
      textContent = extractTextFromReactChildren(props.children);
    }
  }

  return textContent;
}

/**
 * Gets the display name of a React component
 *
 * @param component - React component
 * @returns The component's display name or type name
 */
function getComponentName(component: React.ComponentType<any> | string | undefined): string {
  if (!component) return "";
  if (typeof component === "string") return component;
  return component.displayName || component.name || "Unknown";
}

/**
 * Regex patterns for tracking component nesting levels
 */
const OPEN_TAGS_REGEX = /<[^/][^>]*>/g;
const CLOSE_TAGS_REGEX = /<\/[^>]+>/g;
const SELF_CLOSING_TAG_REGEX = /<[^>]*\/>/g;

/**
 * Extracts text content from a heading that may contain ApiType components
 *
 * @param text - The heading text that may contain ApiType components
 * @returns The heading text with ApiType components replaced by their type values in brackets
 */
export function extractHeadingText(text: string): string {
  if (!text.includes("<ApiType")) {
    return text;
  }

  // Replace ApiType components with bracketed type values
  const apiTypeMatches = text.match(API_TYPE_PATTERN);
  if (apiTypeMatches && apiTypeMatches[1]) {
    return text.replace(apiTypeMatches[0], `[${apiTypeMatches[1]}]`);
  }

  return text;
}

/**
 * Generates a slug ID from heading text
 *
 * @param text - The heading text to convert to an ID
 * @returns A URL-friendly slug ID
 */
export function generateHeadingId(text: string): string {
  // Strip any ApiType components for ID generation
  let idText = text;
  if (text.includes("<ApiType")) {
    idText = text.replace(API_TYPE_PATTERN, "").trim();
  }

  return idText
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Parses a line to determine if it's a heading and extracts heading information
 *
 * @param line - A single line of content to check for heading
 * @returns TOCItem if the line is a heading, null otherwise
 */
export function parseHeadingLine(line: string): TOCItem | null {
  const trimmedLine = line.trim();

  if (!trimmedLine.startsWith("#")) {
    return null;
  }

  const match = trimmedLine.match(HEADING_PATTERN);
  if (!match) {
    return null;
  }

  const level = match[1].length;
  let text = match[2].trim();

  // Process heading text for ApiType components
  text = extractHeadingText(text);

  // Use explicit ID if provided, otherwise generate from text
  const id = match[3] || generateHeadingId(match[2].trim());

  return {
    id,
    text,
    level,
  };
}

/**
 * Extracts table of contents items from markdown content
 * Handles code blocks and component nesting to avoid false positives
 *
 * @param content - The markdown content to process
 * @returns Array of TOCItem objects representing document headings
 */
export function extractHeadings(content: string): TOCItem[] {
  const headings: TOCItem[] = [];

  // Process content line by line
  const lines = content.split("\n");

  // Track state of being inside code blocks or component tags
  let inCodeBlock = false;
  let componentNestingLevel = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Handle code blocks
    if (trimmedLine.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip content inside code blocks
    if (inCodeBlock) {
      continue;
    }

    // Process component tags to track nesting level
    if (line.includes("<")) {
      // Handle self-closing tags first so they don't affect nesting level
      let processedLine = line;
      if (line.includes("/>")) {
        // Temporarily remove self-closing tags for tag counting
        const selfClosingMatches = line.match(SELF_CLOSING_TAG_REGEX) || [];
        for (const match of selfClosingMatches) {
          processedLine = processedLine.replace(match, "");
        }
      }

      // Count opening tags
      if (processedLine.includes("<") && !processedLine.includes("</")) {
        const openMatches = processedLine.match(OPEN_TAGS_REGEX);
        if (openMatches) {
          componentNestingLevel += openMatches.length;
        }
      }

      // Count closing tags
      if (processedLine.includes("</")) {
        const closeMatches = processedLine.match(CLOSE_TAGS_REGEX);
        if (closeMatches) {
          componentNestingLevel -= closeMatches.length;
        }
      }

      // Ensure nesting level doesn't go below 0
      componentNestingLevel = Math.max(0, componentNestingLevel);
    }

    // Process headings only when not inside a component
    if (componentNestingLevel === 0) {
      const heading = parseHeadingLine(line);
      if (heading) {
        headings.push(heading);
      }
    }
  }

  return headings;
}
