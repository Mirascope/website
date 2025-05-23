import { defineLLMDocTemplate, include } from "@/src/lib/content/llm-documents";

export default defineLLMDocTemplate({
  metadata: {
    slug: "llms-full",
    title: "Complete Mirascope & Lilypad Documentation",
    description:
      "Comprehensive documentation for building AI applications with Mirascope and managing them with Lilypad. It includes core concepts, detailed feature guides, and platform documentation in a single concatenated format optimized for LLM consumption.",
  },

  sections: [
    {
      title: "Getting Started",
      content: "Core concepts and quickstart guide",
      includes: [
        include.exact("mirascope/index.mdx"),
        include.exact("mirascope/guides/getting-started/quickstart.mdx"),
      ],
    },
    {
      title: "Learning Mirascope",
      content: "In-depth guides for all framework features",
      includes: [include.glob("mirascope/learn/*.mdx")],
    },
    {
      title: "Lilypad Platform",
      content: "Observability, evaluation, and management tools",
      includes: [include.wildcard("lilypad/*")],
    },
  ],
});
