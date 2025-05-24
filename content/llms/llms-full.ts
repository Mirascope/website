import { defineLLMDocDirective, include } from "@/src/lib/content/llm-directives";

export default defineLLMDocDirective({
  title: "llms-full.txt",
  description:
    "Concatenated documentation for Mirascope and Lilypad, intended to get LLMs up to speed on both products.",
  routePath: "llms-full",
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
