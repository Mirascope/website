import llmsFull from "./llms-full";
import llmsMirascope from "./llms-mirascope";
import llmsLilypad from "./llms-lilypad";
import type { LLMContent } from "@/src/lib/content/llm-content";

const meta: LLMContent[] = [llmsFull, llmsMirascope, llmsLilypad];

export default meta;
