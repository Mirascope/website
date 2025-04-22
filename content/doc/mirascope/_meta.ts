/**
 * Documentation structure for Mirascope
 */
import type { ProductDocs } from "../_meta";
import guidesMeta from "./guides/_meta";
import mirascopeApiMeta from "./api/_meta";

const mirascopeMeta: ProductDocs = {
  // Top level pages
  items: {
    index: {
      title: "Welcome",
      hasExtractableSnippets: true,
    },
  },

  // Grouped pages in main area
  groups: {
    "getting-started": {
      title: "Getting Started",
      items: {
        quickstart: {
          title: "Quickstart",
          hasExtractableSnippets: true,
        },
        why: {
          title: "Why Mirascope?",
          hasExtractableSnippets: true,
        },
        help: {
          title: "Help",
        },
        contributing: {
          title: "Contributing",
        },
        migration: {
          title: "0.x Migration Guide",
        },
      },
    },
    learn: {
      title: "Learn",
      items: {
        index: {
          title: "Overview",
        },
        prompts: {
          title: "Prompts",
          hasExtractableSnippets: true,
        },
        calls: {
          title: "Calls",
          hasExtractableSnippets: true,
        },
        streams: {
          title: "Streams",
          hasExtractableSnippets: true,
        },
        chaining: {
          title: "Chaining",
          hasExtractableSnippets: true,
        },
        response_models: {
          title: "Response Models",
          hasExtractableSnippets: true,
        },
        json_mode: {
          title: "JSON Mode",
          hasExtractableSnippets: true,
        },
        output_parsers: {
          title: "Output Parsers",
          hasExtractableSnippets: true,
        },
        tools: {
          title: "Tools",
          hasExtractableSnippets: true,
        },
        agents: {
          title: "Agents",
          hasExtractableSnippets: true,
        },
        evals: {
          title: "Evals",
          hasExtractableSnippets: true,
        },
        async: {
          title: "Async",
          hasExtractableSnippets: true,
        },
        retries: {
          title: "Retries",
          hasExtractableSnippets: true,
        },
        local_models: {
          title: "Local Models",
          hasExtractableSnippets: true,
        },
      },
    },
    // Provider-specific features
    "learn/provider-specific": {
      title: "Provider-Specific Features",
      items: {
        openai: {
          title: "OpenAI",
          hasExtractableSnippets: true,
        },
        anthropic: {
          title: "Anthropic",
          hasExtractableSnippets: true,
        },
      },
    },
    // Extensions
    "learn/extensions": {
      title: "Extensions",
      items: {
        middleware: {
          title: "Middleware",
          hasExtractableSnippets: true,
        },
        custom_provider: {
          title: "Custom LLM Provider",
        },
      },
    },
    // MCP - Model Context Protocol
    "learn/mcp": {
      title: "MCP - Model Context Protocol",
      items: {
        client: {
          title: "Client",
          hasExtractableSnippets: true,
        },
      },
    },
    integrations: {
      title: "Integrations",
      items: {
        langfuse: {
          title: "Langfuse",
          hasExtractableSnippets: true,
        },
        hyperdx: {
          title: "HyperDX",
          hasExtractableSnippets: true,
        },
        logfire: {
          title: "Logfire",
          hasExtractableSnippets: true,
        },
        otel: {
          title: "OpenTelemetry",
          hasExtractableSnippets: true,
        },
      },
    },
  },

  // Sections (like API, Guides)
  sections: {
    api: mirascopeApiMeta,
    guides: guidesMeta,
  },
};

export default mirascopeMeta;
