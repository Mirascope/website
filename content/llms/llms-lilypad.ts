import { LLMContent, withTableOfContents } from "@/src/lib/content/llm-content";
import { include } from "@/src/lib/content/llm-includes";
import { LILYPAD } from "@/src/lib/constants/site";

// Create the base content structure
export const lilypadContent = LLMContent.fromChildren({
  slug: "lilypad",
  title: "Lilypad",
  description: LILYPAD.tagline,
  route: "/docs/lilypad/llms-full",
  children: include.flatTree("lilypad"),
});

// Export with table of contents for standalone use
export default withTableOfContents(lilypadContent);
