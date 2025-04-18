import { parseFrontmatter } from "./frontmatter";

export interface ProcessedContent {
  content: string;
  frontmatter: Record<string, any>;
  code: string;
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
