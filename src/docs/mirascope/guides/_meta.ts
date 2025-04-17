/**
 * Documentation structure for Mirascope Guides
 */
import type { DocSection } from "../../_meta";

const guidesMeta: DocSection = {
  title: "Guides",

  // Top-level guides pages
  items: {
    index: {
      title: "Overview",
    },
  },

  // Grouped guides by category
  groups: {
    "getting-started": {
      title: "Getting Started",
      items: {
        "structured-outputs": {
          title: "Structured Outputs",
        },
        "dynamic-configuration-and-chaining": {
          title: "Dynamic Configuration & Chaining",
        },
        "tools-and-agents": {
          title: "Tools & Agents",
        },
      },
    },
    agents: {
      title: "Agents",
      items: {
        "blog-writing-agent": {
          title: "Agent Executor: Blog Writing",
        },
        "documentation-agent": {
          title: "Documentation Agent",
        },
        "local-chat-with-codebase": {
          title: "Local Chat with Codebase",
        },
        "localized-agent": {
          title: "Localized Agent",
        },
        "qwant-search-agent-with-sources": {
          title: "Qwant Search Agent with Sources",
        },
        "sql-agent": {
          title: "Generate SQL with LLM",
        },
      },
    },
    evals: {
      title: "Evals",
      items: {
        "evaluating-documentation-agent": {
          title: "Evaluating Documentation Agent",
        },
        "evaluating-web-search-agent": {
          title: "Evaluating Web Search Agent with LLM",
        },
      },
    },
    "langgraph-vs-mirascope": {
      title: "Langgraph Vs Mirascope",
      items: {
        quickstart: {
          title: "LangGraph Quickstart using Mirascope",
        },
      },
    },
    "more-advanced": {
      title: "More Advanced",
      items: {
        "code-generation-and-execution": {
          title: "Code Generation and Execution",
        },
        "document-segmentation": {
          title: "Document Segmentation",
        },
        "extract-from-pdf": {
          title: "Extracting from PDF",
        },
        "extraction-using-vision": {
          title: "Extraction using Vision",
        },
        "generating-captions": {
          title: "Generate Captions for an Image",
        },
        "generating-synthetic-data": {
          title: "Generate Synthetic Data",
        },
        "llm-validation-with-retries": {
          title: "LLM Validation With Retries",
        },
        "named-entity-recognition": {
          title: "Named Entity Recognition",
        },
        "o1-style-thinking": {
          title: "o1 Style Thinking",
        },
        "pii-scrubbing": {
          title: "PII Scrubbing",
        },
        "query-plan": {
          title: "Query Plan",
        },
        "removing-semantic-duplicates": {
          title: "Removing Semantic Duplicates",
        },
        "search-with-sources": {
          title: "Search with Sources",
        },
        "speech-transcription": {
          title: "Transcribing Speech",
        },
        "support-ticket-routing": {
          title: "Support Ticket Routing",
        },
        "text-classification": {
          title: "Text Classification",
        },
        "text-summarization": {
          title: "Text Summarization",
        },
        "text-translation": {
          title: "Text Translation",
        },
      },
    },
    "prompt-engineering": {
      title: "Prompt Engineering",
      items: {
        "chain-of-verification": {
          title: "Chain of Verification: Enhancing LLM Accuracy through Self-Verification",
        },
        "decomposed-prompting": {
          title: "Decomposed Prompting: Enhancing LLM Problem-Solving with Tool-Based Subproblems",
        },
        "demonstration-ensembling": {
          title: "Demonstration Ensembling: Enhancing LLM Responses with Aggregated Examples",
        },
        diverse: {
          title: "DiVeRSe: Enhancing LLM Reasoning with Prompt Variations",
        },
        "mixture-of-reasoning": {
          title: "Mixture of Reasoning: Enhancing LLM Performance with Multiple Techniques",
        },
        "prompt-paraphrasing": {
          title: "Prompt Paraphrasing: Generating Diverse Prompts for LLM Testing and Evaluation",
        },
        "self-consistency": {
          title: "Self-Consistency: Enhancing LLM Reasoning with Multiple Outputs",
        },
        "self-refine": {
          title: "Self-Refine: Enhancing LLM Outputs Through Iterative Self-Improvement",
        },
        "sim-to-m": {
          title: "Sim to M: Enhancing LLM Reasoning with Perspective-Taking",
        },
        "skeleton-of-thought": {
          title: "Skeleton of Thought: Enhancing LLM Response Speed",
        },
        "step-back": {
          title: "Step-back Prompting: Enhancing LLM Reasoning with High-Level Questions",
        },
        "system-to-attention": {
          title: "System to Attention (S2A): Enhancing LLM Focus with Query Filtering",
        },
        "chain-of-thought": {
          title: "Chain of Thought",
        },
        "common-phrases": {
          title: "Common Phrases (Prompt Mining)",
        },
        "contrastive-chain-of-thought": {
          title: "Contrastive Chain of Thought",
        },
        "emotion-prompting": {
          title: "Emotion Prompting",
        },
        "plan-and-solve": {
          title: "Plan and Solve",
        },
        "rephrase-and-respond": {
          title: "Rephrase and Respond",
        },
        rereading: {
          title: "Rereading",
        },
        "self-ask": {
          title: "Self-Ask",
        },
        "thread-of-thought": {
          title: "Thread of Thought",
        },
        "least-to-most": {
          title: "Least to Most",
        },
        "reverse-chain-of-thought": {
          title: "Reverse Chain of Thought",
        },
        "role-prompting": {
          title: "Role Prompting",
        },
        "tabular-chain-of-thought": {
          title: "Tabular Chain of Thought",
        },
      },
    },
  },
};

export default guidesMeta;
