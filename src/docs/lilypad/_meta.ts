/**
 * Documentation structure for Lilypad
 */
import type { ProductDocs } from "../_meta";

const lilypadMeta: ProductDocs = {
  // Top level pages
  items: {
    index: {
      title: "Welcome",
    },
  },

  // Grouped pages in main area
  groups: {
    "getting-started": {
      title: "Getting Started",
      items: {
        quickstart: {
          title: "Quickstart",
        },
        playground: {
          title: "Playground",
        },
        "open-source": {
          title: "Open Source",
        },
        "self-hosting": {
          title: "Self-Hosting",
        },
      },
    },
    evaluation: {
      title: "Evaluation",
      items: {
        annotations: {
          title: "Annotations",
        },
        comparisons: {
          title: "Comparisons",
        },
        "cost-and-latency-tracking": {
          title: "Cost & Latency Tracking",
        },
      },
    },
    observability: {
      title: "Observability",
      items: {
        opentelemetry: {
          title: "OpenTelemetry",
        },
        spans: {
          title: "Spans",
        },
        traces: {
          title: "Traces",
        },
        versioning: {
          title: "Versioning",
        },
      },
    },
    "under-development": {
      title: "Under Development",
      items: {
        "vibe-synthesis": {
          title: "Vibe Synthesis",
        },
        experiments: {
          title: "Experiments",
        },
      },
    },
  },

  // Sections (like API)
  sections: {
    api: {
      title: "API",

      // Top-level API pages
      items: {
        index: {
          title: "Lilypad API Reference",
        },
      },
    },
  },
};

export default lilypadMeta;
