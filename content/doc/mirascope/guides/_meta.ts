/**
 * Documentation structure for Mirascope Guides
 */
import type { SectionSpec } from "@/src/lib/content/spec";

const guidesMeta: SectionSpec = {
  slug: "guides",
  label: "Guides",
  children: [
    {
      slug: "index",
      label: "Overview",
    },
    {
      slug: "getting-started",
      label: "Getting Started",
      hasNoContent: true,
      children: [
        {
          slug: "structured-outputs",
          label: "Structured Outputs",
        },
        {
          slug: "dynamic-configuration-and-chaining",
          label: "Dynamic Configuration & Chaining",
        },
        {
          slug: "tools-and-agents",
          label: "Tools & Agents",
        },
      ],
    },
    {
      slug: "agents",
      label: "Agents",
      hasNoContent: true,
      children: [
        {
          slug: "web-search-agent",
          label: "Web Search Agent",
        },
        {
          slug: "blog-writing-agent",
          label: "Agent Executor: Blog Writing",
        },
        {
          slug: "documentation-agent",
          label: "Documentation Agent",
        },
        {
          slug: "local-chat-with-codebase",
          label: "Local Chat with Codebase",
        },
        {
          slug: "localized-agent",
          label: "Localized Agent",
        },
        {
          slug: "qwant-search-agent-with-sources",
          label: "Qwant Search Agent with Sources",
        },
        {
          slug: "sql-agent",
          label: "Generate SQL with LLM",
        },
      ],
    },
    {
      slug: "evals",
      label: "Evals",
      hasNoContent: true,
      children: [
        {
          slug: "evaluating-documentation-agent",
          label: "Evaluating Documentation Agent",
        },
        {
          slug: "evaluating-web-search-agent",
          label: "Evaluating Web Search Agent with LLM",
        },
        {
          slug: "evaluating-sql-agent",
          label: "Evaluating Generating SQL with LLM",
        },
      ],
    },
    {
      slug: "langgraph-vs-mirascope",
      label: "Langgraph Vs Mirascope",
      hasNoContent: true,
      children: [
        {
          slug: "quickstart",
          label: "LangGraph Quickstart using Mirascope",
        },
      ],
    },
    {
      slug: "more-advanced",
      label: "More Advanced",
      hasNoContent: true,
      children: [
        {
          slug: "code-generation-and-execution",
          label: "Code Generation and Execution",
        },
        {
          slug: "document-segmentation",
          label: "Document Segmentation",
        },
        {
          slug: "extract-from-pdf",
          label: "Extracting from PDF",
        },
        {
          slug: "extraction-using-vision",
          label: "Extraction using Vision",
        },
        {
          slug: "generating-captions",
          label: "Generate Captions for an Image",
        },
        {
          slug: "generating-synthetic-data",
          label: "Generate Synthetic Data",
        },
        {
          slug: "llm-validation-with-retries",
          label: "LLM Validation With Retries",
        },
        {
          slug: "named-entity-recognition",
          label: "Named Entity Recognition",
        },
        {
          slug: "o1-style-thinking",
          label: "o1 Style Thinking",
        },
        {
          slug: "pii-scrubbing",
          label: "PII Scrubbing",
        },
        {
          slug: "query-plan",
          label: "Query Plan",
        },
        {
          slug: "removing-semantic-duplicates",
          label: "Removing Semantic Duplicates",
        },
        {
          slug: "search-with-sources",
          label: "Search with Sources",
        },
        {
          slug: "speech-transcription",
          label: "Transcribing Speech",
        },
        {
          slug: "support-ticket-routing",
          label: "Support Ticket Routing",
        },
        {
          slug: "text-classification",
          label: "Text Classification",
        },
        {
          slug: "text-summarization",
          label: "Text Summarization",
        },
        {
          slug: "text-translation",
          label: "Text Translation",
        },
        {
          slug: "knowledge-graph",
          label: "Knowledge Graph",
        },
      ],
    },
    {
      slug: "prompt-engineering",
      label: "Prompt Engineering",
      hasNoContent: true,
      children: [
        {
          slug: "chain-of-verification",
          label: "Chain of Verification: Enhancing LLM Accuracy through Self-Verification",
        },
        {
          slug: "decomposed-prompting",
          label: "Decomposed Prompting: Enhancing LLM Problem-Solving with Tool-Based Subproblems",
        },
        {
          slug: "demonstration-ensembling",
          label: "Demonstration Ensembling: Enhancing LLM Responses with Aggregated Examples",
        },
        {
          slug: "diverse",
          label: "DiVeRSe: Enhancing LLM Reasoning with Prompt Variations",
        },
        {
          slug: "mixture-of-reasoning",
          label: "Mixture of Reasoning: Enhancing LLM Performance with Multiple Techniques",
        },
        {
          slug: "prompt-paraphrasing",
          label: "Prompt Paraphrasing: Generating Diverse Prompts for LLM Testing and Evaluation",
        },
        {
          slug: "self-consistency",
          label: "Self-Consistency: Enhancing LLM Reasoning with Multiple Outputs",
        },
        {
          slug: "self-refine",
          label: "Self-Refine: Enhancing LLM Outputs Through Iterative Self-Improvement",
        },
        {
          slug: "sim-to-m",
          label: "Sim to M: Enhancing LLM Reasoning with Perspective-Taking",
        },
        {
          slug: "skeleton-of-thought",
          label: "Skeleton of Thought: Enhancing LLM Response Speed",
        },
        {
          slug: "step-back",
          label: "Step-back Prompting: Enhancing LLM Reasoning with High-Level Questions",
        },
        {
          slug: "system-to-attention",
          label: "System to Attention (S2A): Enhancing LLM Focus with Query Filtering",
        },
        {
          slug: "chain-of-thought",
          label: "Chain of Thought",
        },
        {
          slug: "common-phrases",
          label: "Common Phrases (Prompt Mining)",
        },
        {
          slug: "contrastive-chain-of-thought",
          label: "Contrastive Chain of Thought",
        },
        {
          slug: "emotion-prompting",
          label: "Emotion Prompting",
        },
        {
          slug: "plan-and-solve",
          label: "Plan and Solve",
        },
        {
          slug: "rephrase-and-respond",
          label: "Rephrase and Respond",
        },
        {
          slug: "rereading",
          label: "Rereading",
        },
        {
          slug: "self-ask",
          label: "Self-Ask",
        },
        {
          slug: "thread-of-thought",
          label: "Thread of Thought",
        },
        {
          slug: "least-to-most",
          label: "Least to Most",
        },
        {
          slug: "reverse-chain-of-thought",
          label: "Reverse Chain of Thought",
        },
        {
          slug: "role-prompting",
          label: "Role Prompting",
        },
        {
          slug: "tabular-chain-of-thought",
          label: "Tabular Chain of Thought",
        },
      ],
    },
  ],
};

export default guidesMeta;
