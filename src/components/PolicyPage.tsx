import React, { useState } from "react";
import { MDXRenderer } from "@/components/MDXRenderer";
import { type PolicyContent } from "@/lib/content/policy";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

interface PolicyPageProps {
  content: PolicyContent | null;
  loading: boolean;
  error: Error | null;
  type?: "privacy" | "terms-use" | "terms-service";
}

/**
 * PolicyPage - Reusable component for rendering policy and terms pages
 */
const PolicyPage: React.FC<PolicyPageProps> = ({ content, loading, error, type = "privacy" }) => {
  // Content ID for the article element
  const contentId = "policy-content";

  // Default title based on type
  const defaultTitle = {
    privacy: "PRIVACY POLICY",
    "terms-use": "TERMS OF USE",
    "terms-service": "TERMS OF SERVICE",
  }[type];

  const title = content?.meta?.title ?? defaultTitle;
  const lastUpdated = content?.meta?.lastUpdated ? formatDate(content.meta.lastUpdated) : "";

  // Initialize fun mode from localStorage if available
  const [funMode, setFunMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("funMode") === "true";
    }
    return false;
  });

  // Toggle fun mode for policy content
  const toggleFunMode = () => {
    const newMode = !funMode;
    setFunMode(newMode);

    // Save preference to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("funMode", newMode.toString());
    }
  };

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

  if (error || !content || !content.mdx) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold uppercase">{defaultTitle}</h1>
        </div>
        <p>This content is currently unavailable. Please check back later.</p>
        {error && <p className="text-red-500 mt-2">Error: {error.message}</p>}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with title and fun mode button aligned horizontally */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase">{title}</h1>
          {lastUpdated && (
            <p className="font-medium text-gray-500 dark:text-gray-400 mt-1">
              Last Updated: {lastUpdated}
            </p>
          )}
        </div>
        <Button
          variant={funMode ? "default" : "outline"}
          size="sm"
          onClick={toggleFunMode}
          className={cn(
            funMode ? "bg-primary text-white" : "hover:bg-purple-50",
            "transition-colors"
          )}
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Fun Mode
        </Button>
      </div>

      <div
        id={contentId}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200 dark:border-gray-700"
      >
        <article className="prose prose-lg max-w-none">
          <MDXRenderer
            code={content.mdx.code}
            frontmatter={content.mdx.frontmatter}
            useFunMode={funMode}
          />
        </article>
      </div>
    </div>
  );
};

export default PolicyPage;
