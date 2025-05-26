import { defineLLMDocDirective, include, section } from "@/src/lib/content/llm-directives";
import { MIRASCOPE } from "@/src/lib/constants/site";

export default defineLLMDocDirective({
  title: "Mirascope LLM Reference",
  description: `Complete Mirascope documentation for LLMs. ${MIRASCOPE.tagline}`,
  routePath: "docs/mirascope/llms",
  sections: [
    section(
      "Mirascope",
      [
        // Getting Started
        include.exact("mirascope/index.mdx"),
        include.exact("mirascope/guides/getting-started/quickstart.mdx"),

        // Learning Mirascope
        include.glob("mirascope/learn/*.mdx"),
      ],
      MIRASCOPE.tagline,
      "/docs/mirascope/llms"
    ),
  ],
});
