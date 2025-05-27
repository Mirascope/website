import { LLMContent, withTableOfContents } from "@/src/lib/content/llm-content";
import { include } from "@/src/lib/content/llm-includes";
import { MIRASCOPE } from "@/src/lib/constants/site";

// Create the base content structure
export const mirascopeContent = LLMContent.fromChildren({
  slug: "mirascope",
  title: "Mirascope",
  description: MIRASCOPE.tagline,
  route: "/docs/mirascope/llms-full",
  children: [
    // Getting Started
    include.file("mirascope/index.mdx"),
    include.file("mirascope/guides/getting-started/quickstart.mdx"),
    // Learning Mirascope
    ...include.directory("mirascope/learn"),
  ],
});

// Export with table of contents for standalone use
export default withTableOfContents(mirascopeContent);
