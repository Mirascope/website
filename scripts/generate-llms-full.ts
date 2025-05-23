import fs from "fs";
import path from "path";
import { getAllDocInfo } from "@/src/lib/content";
import { parseFrontmatter } from "@/src/lib/content/mdx-processing";
import type { DocInfo } from "@/src/lib/content/spec";

/**
 * Route specification for llms_full.txt generation
 */
interface LLMsFullSpec {
  docs_routes: string[];
}

/**
 * Generate llms_full.txt file containing concatenated documentation content
 */
export async function generateLLMsFull(): Promise<void> {
  console.log("Generating llms_full.txt...");

  try {
    // Load the route specification
    const specPath = path.join(process.cwd(), "content", "llms_full_spec.json");
    const specContent = fs.readFileSync(specPath, "utf-8");
    const spec: LLMsFullSpec = JSON.parse(specContent);

    // Get all available docs
    const allDocs = getAllDocInfo();

    // Filter docs based on route patterns
    const filteredDocs = filterDocsByRoutes(allDocs, spec.docs_routes);

    console.log(`Found ${filteredDocs.length} docs matching route patterns`);

    // Generate the content
    const content = await generateContent(filteredDocs);

    // Ensure dist directory exists
    const distDir = path.join(process.cwd(), "dist");
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Write to dist/llms_full.txt
    const outputPath = path.join(distDir, "llms_full.txt");
    fs.writeFileSync(outputPath, content, "utf-8");

    console.log(`Generated llms_full.txt with ${content.length} characters`);
  } catch (error) {
    console.error("Error generating llms_full.txt:", error);
    throw error;
  }
}

/**
 * Filter docs based on route patterns
 */
function filterDocsByRoutes(docs: DocInfo[], routePatterns: string[]): DocInfo[] {
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
 * Pattern format: "mirascope/learn/*" matches docs under mirascope/learn/
 */
function matchesRoutePattern(docPath: string, pattern: string): boolean {
  // Remove leading/trailing slashes and normalize
  const normalizedPath = docPath.replace(/^\/+|\/+$/g, "");
  const normalizedPattern = pattern.replace(/^\/+|\/+$/g, "");

  if (normalizedPattern.endsWith("/*")) {
    // Pattern with wildcard: check if path starts with the prefix
    const prefix = normalizedPattern.slice(0, -2); // Remove "/*"
    return normalizedPath.startsWith(prefix);
  } else {
    // Exact match
    return normalizedPath === normalizedPattern;
  }
}

/**
 * Generate the combined content from filtered docs
 */
async function generateContent(docs: DocInfo[]): Promise<string> {
  const sections: string[] = [];

  for (const doc of docs) {
    try {
      // Read the raw MDX file
      const filePath = path.join(process.cwd(), "content", "docs", `${doc.path}.mdx`);

      if (!fs.existsSync(filePath)) {
        console.warn(`Warning: File not found: ${filePath}`);
        continue;
      }

      const rawContent = fs.readFileSync(filePath, "utf-8");

      // Parse frontmatter and content
      const { frontmatter, content } = parseFrontmatter(rawContent);

      // Create section with title and description from frontmatter
      let section = "";

      if (frontmatter.title) {
        section += `# ${frontmatter.title}\n\n`;
      }

      if (frontmatter.description) {
        section += `Description: ${frontmatter.description}\n\n`;
      }

      // Add the clean markdown content
      section += content;

      sections.push(section);
    } catch (error) {
      console.error(`Error processing doc ${doc.path}:`, error);
      // Continue with other docs
    }
  }

  // Join all sections with separators
  return sections.join("\n\n---\n\n");
}

// Run the generation when this script is executed directly
if (import.meta.main) {
  generateLLMsFull().catch((error) => {
    console.error("Fatal error during llms_full.txt generation:", error);
    process.exit(1);
  });
}
