import type { ProductSpec, SectionSpec } from "@/src/lib/content/spec";
import guides from "./guides/_meta";
import api from "./api/_meta";

const docsSection: SectionSpec = {
  label: "Docs",
  slug: "index",
  weight: 2,
  children: [
    {
      slug: "index",
      label: "Welcome",
      hasExtractableSnippets: true,
    },
    {
      slug: "getting-started",
      label: "Getting Started",
      weight: 2,
      children: [
        {
          slug: "quickstart",
          label: "Quickstart",
          hasExtractableSnippets: true,
        },
        {
          slug: "why",
          label: "Why Mirascope?",
          hasExtractableSnippets: true,
        },
        {
          slug: "help",
          label: "Help",
        },
        {
          slug: "contributing",
          label: "Contributing",
        },
        {
          slug: "migration",
          label: "0.x Migration Guide",
        },
      ],
    },
    {
      slug: "learn",
      label: "Learn",
      weight: 4,
      children: [
        {
          slug: "index",
          label: "Overview",
        },
        {
          slug: "prompts",
          label: "Prompts",
          hasExtractableSnippets: true,
        },
        {
          slug: "calls",
          label: "Calls",
          hasExtractableSnippets: true,
        },
        {
          slug: "streams",
          label: "Streams",
          hasExtractableSnippets: true,
        },
        {
          slug: "chaining",
          label: "Chaining",
          hasExtractableSnippets: true,
        },
        {
          slug: "response_models",
          label: "Response Models",
          hasExtractableSnippets: true,
        },
        {
          slug: "json_mode",
          label: "JSON Mode",
          hasExtractableSnippets: true,
        },
        {
          slug: "output_parsers",
          label: "Output Parsers",
          hasExtractableSnippets: true,
        },
        {
          slug: "tools",
          label: "Tools",
          hasExtractableSnippets: true,
        },
        {
          slug: "agents",
          label: "Agents",
          hasExtractableSnippets: true,
        },
        {
          slug: "evals",
          label: "Evals",
          hasExtractableSnippets: true,
        },
        {
          slug: "async",
          label: "Async",
          hasExtractableSnippets: true,
        },
        {
          slug: "retries",
          label: "Retries",
          hasExtractableSnippets: true,
        },
        {
          slug: "local_models",
          label: "Local Models",
          hasExtractableSnippets: true,
        },
      ],
    },
    {
      slug: "learn/provider-specific",
      label: "Provider-Specific Features",
      children: [
        {
          slug: "openai",
          label: "OpenAI",
          hasExtractableSnippets: true,
        },
        {
          slug: "anthropic",
          label: "Anthropic",
          hasExtractableSnippets: true,
        },
      ],
    },
    {
      slug: "learn/extensions",
      label: "Extensions",
      children: [
        {
          slug: "middleware",
          label: "Middleware",
          hasExtractableSnippets: true,
        },
        {
          slug: "custom_provider",
          label: "Custom LLM Provider",
        },
      ],
    },
    {
      slug: "learn/mcp",
      label: "MCP - Model Context Protocol",
      children: [
        {
          slug: "client",
          label: "Client",
          hasExtractableSnippets: true,
        },
      ],
    },
  ],
};

/**
 * Documentation structure for mirascope in new DocSpec format
 */
const mirascopeSpec: ProductSpec = {
  product: "mirascope",
  sections: [docsSection, guides, api],
};
export default mirascopeSpec;
