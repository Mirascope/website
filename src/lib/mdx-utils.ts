import { serialize } from "next-mdx-remote/serialize";

export interface ProcessedMDX {
  code: string;
  frontmatter: Record<string, any>;
}

/* This content has been moved to code-highlight.ts */

/**
 * Extracts and parses frontmatter from MDX content
 */
function extractFrontmatter(source: string): { content: string; frontmatter: Record<string, any> } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = source.match(frontmatterRegex);

  if (!match) {
    return { content: source, frontmatter: {} };
  }

  const frontmatterStr = match[1];
  const content = match[2];

  // Parse frontmatter into key-value pairs
  const frontmatter: Record<string, any> = {};
  const lines = frontmatterStr.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      // Remove quotes from value if present
      const value = line
        .slice(colonIndex + 1)
        .trim()
        .replace(/^"(.*)"$/, "$1");
      frontmatter[key] = value;
    }
  }

  return { content, frontmatter };
}

/**
 * Processes MDX content using next-mdx-remote/serialize
 */
export async function processMDX(source: string): Promise<ProcessedMDX> {
  if (!source) {
    return { code: "", frontmatter: {} };
  }

  try {
    // Extract frontmatter - note that serialize handles this automatically,
    // but we need to extract it ourselves to return it separately
    const { content, frontmatter } = extractFrontmatter(source);

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
