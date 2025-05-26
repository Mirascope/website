import { defineLLMDocDirective, include, section } from "@/src/lib/content/llm-directives";
import { LILYPAD } from "@/src/lib/constants/site";

export default defineLLMDocDirective({
  title: "llms-lilypad.txt",
  description: `Complete Lilypad documentation for LLMs. ${LILYPAD.tagline}`,
  routePath: "docs/lilypad/llms",
  sections: [section("Lilypad", [include.wildcard("lilypad/*")], LILYPAD.tagline, "/docs/lilypad")],
});
