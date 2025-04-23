import type { ProductSpec } from "@/src/lib/content/spec";
/**
 * Documentation structure for lilypad in new DocSpec format
 */
const lilypadSpec: ProductSpec = {
  sections: [
    {
      slug: "index",
      label: "Lilypad",
      children: [
        {
          slug: "index",
          label: "Welcome",
        },
        {
          slug: "getting-started",
          label: "Getting Started",
          children: [
            {
              slug: "quickstart",
              label: "Quickstart",
            },
            {
              slug: "playground",
              label: "Playground",
            },
            {
              slug: "open-source",
              label: "Open Source",
            },
            {
              slug: "self-hosting",
              label: "Self-Hosting",
            },
          ],
        },
        {
          slug: "evaluation",
          label: "Evaluation",
          children: [
            {
              slug: "annotations",
              label: "Annotations",
            },
            {
              slug: "comparisons",
              label: "Comparisons",
            },
            {
              slug: "cost-and-latency-tracking",
              label: "Cost & Latency Tracking",
            },
          ],
        },
        {
          slug: "observability",
          label: "Observability",
          children: [
            {
              slug: "opentelemetry",
              label: "OpenTelemetry",
            },
            {
              slug: "spans",
              label: "Spans",
            },
            {
              slug: "traces",
              label: "Traces",
            },
            {
              slug: "versioning",
              label: "Versioning",
            },
          ],
        },
        {
          slug: "under-development",
          label: "Under Development",
          children: [
            {
              slug: "vibe-synthesis",
              label: "Vibe Synthesis",
            },
            {
              slug: "experiments",
              label: "Experiments",
            },
          ],
        },
      ],
    },

    {
      slug: "api",
      label: "API",
      children: [
        {
          slug: "index",
          label: "Lilypad API Reference",
        },
      ],
    },
  ],
};

export default lilypadSpec;
