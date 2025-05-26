import llmsFull from "./llms-full";
import llmsMirascope from "./llms-mirascope";
import llmsLilypad from "./llms-lilypad";
import type { LLMDocMeta } from "@/src/lib/content/llm-directives";

const meta: LLMDocMeta = {
  documents: [llmsFull, llmsMirascope, llmsLilypad],
};
export default meta;
