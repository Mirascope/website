import type { ProductSpec } from "@/src/lib/content/spec";

const mirascopeV2Spec: ProductSpec = {
  product: "mirascope-v2",
  sections: [
    {
      label: "Docs",
      slug: "index",
      weight: 2,
      children: [
        {
          slug: "index",
          label: "Welcome to Mirascope V2",
        },
      ],
    },
  ],
};

export default mirascopeV2Spec;
