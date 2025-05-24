import { defineLLMDocDirective, include } from "@/src/lib/content/llm-documents";

export default defineLLMDocDirective({
  title: "Complete Mirascope & Lilypad Documentation",
  description:
    "Comprehensive documentation for building AI applications with Mirascope and managing them with Lilypad. It includes core concepts, detailed feature guides, and platform documentation in a single concatenated format optimized for LLM consumption.",
  routePath: "docs/llms-full",
  includes: [
    // Getting Started
    include.exact("mirascope/index.mdx"),
    include.exact("mirascope/guides/getting-started/quickstart.mdx"),

    // Learning Mirascope
    include.glob("mirascope/learn/*.mdx"),

    // Lilypad Platform
    include.wildcard("lilypad/*"),
  ],
});
