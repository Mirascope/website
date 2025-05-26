import { defineLLMDocDirective } from "@/src/lib/content/llm-directives";
import mirascopeDoc from "./llms-mirascope";
import lilypadDoc from "./llms-lilypad";

export default defineLLMDocDirective({
  title: "llms-full.txt",
  description:
    "Concatenated documentation for Mirascope and Lilypad, intended to get LLMs up to speed on both products.",
  routePath: "llms-full",
  sections: [...mirascopeDoc.sections, ...lilypadDoc.sections],
});
