import { defineLLMDocDirective, include } from "@/src/lib/content/llm-documents";

export default defineLLMDocDirective({
  title: "Combined Mirascope & Lilypad Docs — for LLMs",
  description:
    "Concatenated documentation for Mirascope and Lilypad, intended to get LLMs up to speed on both products.",
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
