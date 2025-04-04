import React from "react";
import { MDXRenderer } from "@/components/MDXRenderer";
import { type PolicyMeta, formatDate } from "@/lib/policy-utils";

interface PolicyPageProps {
  meta: PolicyMeta;
  compiledMDX: {
    code: string;
    frontmatter: Record<string, any>;
  } | null;
  loading: boolean;
  error: string | null;
  type?: "privacy" | "terms-use" | "terms-service";
}

/**
 * PolicyPage - Reusable component for rendering policy and terms pages
 */
const PolicyPage: React.FC<PolicyPageProps> = ({
  meta,
  compiledMDX,
  loading,
  error,
  type = "privacy",
}) => {
  // Default title based on type
  const defaultTitle = {
    privacy: "PRIVACY POLICY",
    "terms-use": "TERMS OF USE",
    "terms-service": "TERMS OF SERVICE",
  }[type];

  const title = meta?.title || defaultTitle;
  const lastUpdated = meta?.lastUpdated ? formatDate(meta.lastUpdated) : "";

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold uppercase">{defaultTitle}</h1>
        </div>
        <div className="animate-pulse bg-gray-100 h-40 rounded-md"></div>
      </div>
    );
  }

  if (error || !compiledMDX) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold uppercase">{defaultTitle}</h1>
        </div>
        <p>This content is currently unavailable. Please check back later.</p>
        {error && <p className="text-red-500 mt-2">Error: {error}</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold uppercase">{title}</h1>
        {lastUpdated && <p className="font-bold mt-2">Last Updated: {lastUpdated}</p>}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <article className="prose prose-lg max-w-none">
          <MDXRenderer code={compiledMDX.code} frontmatter={compiledMDX.frontmatter} />
        </article>
      </div>
    </div>
  );
};

export default PolicyPage;
