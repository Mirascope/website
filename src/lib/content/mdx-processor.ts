import { parseFrontmatter } from "./frontmatter";

export interface ProcessedMDX {
  code: string;
  frontmatter: Record<string, any>;
}

export interface ProcessedContent {
  content: string;
  frontmatter: Record<string, any>;
  code: string;
}

/**
 * Processes MDX content using next-mdx-remote/serialize with enhanced error handling
 * @deprecated Use processMDXContent instead
 */
export async function processMDX(source: string): Promise<ProcessedMDX> {
  if (!source) {
    return { code: "", frontmatter: {} };
  }

  try {
    // Extract frontmatter - note that serialize handles this automatically,
    // but we need to extract it ourselves to return it separately
    const { frontmatter, content } = parseFrontmatter(source);

    // Dynamically import next-mdx-remote/serialize since it's an ESM module
    const { serialize } = await import("next-mdx-remote/serialize");

    // Use next-mdx-remote's serialize function to compile the MDX
    // We'll handle code highlighting in the custom component instead of rehype
    const mdxSource = await serialize(content, {
      // Include frontmatter in the scope
      scope: frontmatter,
    });

    // next-mdx-remote/serialize returns an object with compiledSource
    // which is what MDXRemote component expects
    return {
      code: mdxSource.compiledSource,
      frontmatter,
    };
  } catch (error) {
    console.error("Error processing MDX:", error);
    // Return an error message as MDX
    return {
      code: `export default function ErrorComponent() {
        return (
          <div style={{ color: 'red', padding: '1rem', border: '1px solid red' }}>
            <h2>Error processing MDX</h2>
            <p>${error instanceof Error ? error.message : String(error)}</p>
          </div>
        )
      }`,
      frontmatter: { title: "Error", description: "Error processing MDX" },
    };
  }
}

/**
 * Enhanced MDX processing that supports preprocessing and returns full content info
 *
 * @param rawContent - Raw content string with frontmatter
 * @param options - Processing options
 * @returns Processed content with frontmatter, content and compiled code
 */
export async function processMDXContent(
  rawContent: string,
  options?: { preprocessContent?: (content: string) => string }
): Promise<ProcessedContent> {
  if (!rawContent) {
    return { content: "", frontmatter: {}, code: "" };
  }

  try {
    // Extract frontmatter once
    const { frontmatter, content } = parseFrontmatter(rawContent);

    // Apply any preprocessing
    const processedContent = options?.preprocessContent
      ? options.preprocessContent(content)
      : content;

    // Dynamically import next-mdx-remote/serialize since it's an ESM module
    const { serialize } = await import("next-mdx-remote/serialize");
    const mdxSource = await serialize(processedContent, { scope: frontmatter });

    // Return complete processed content
    return {
      content: processedContent,
      frontmatter,
      code: mdxSource.compiledSource,
    };
  } catch (error) {
    console.error("Error processing MDX content:", error);
    return {
      content: "",
      frontmatter: { title: "Error", description: "Error processing MDX" },
      code: `export default function ErrorComponent() {
        return (
          <div style={{ color: 'red', padding: '1rem', border: '1px solid red' }}>
            <h2>Error processing MDX</h2>
            <p>${error instanceof Error ? error.message : String(error)}</p>
          </div>
        )
      }`,
    };
  }
}
