import React, { useState } from "react";
import { LoadingContent } from "@/src/components/docs";
import { MDXRenderer } from "@/src/components/MDXRenderer";
import { type PolicyContent } from "@/src/lib/content";
import { Button } from "@/src/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn, formatDate } from "@/src/lib/utils";

interface PolicyPageProps {
  content: PolicyContent;
  type?: "privacy" | "terms-use" | "terms-service";
}

/**
 * PolicyPage - Reusable component for rendering policy and terms pages
 */
const PolicyPage: React.FC<PolicyPageProps> = ({ content, type = "privacy" }) => {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with title and fun mode button aligned horizontally */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase">{title}</h1>
          {lastUpdated && (
            <p className="font-medium text-muted-foreground mt-1">Last Updated: {lastUpdated}</p>
          )}
        </div>
        <Button
          variant={funMode ? "default" : "outline"}
          size="sm"
          onClick={toggleFunMode}
          className={cn(
            funMode ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            "transition-colors"
          )}
        >
          <Sparkles className="w-4 h-4 mr-1" />
          Fun Mode
        </Button>
      </div>

      <div
        id={contentId}
        className="bg-background rounded-xl shadow-sm p-4 sm:p-6 border border-border"
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

/**
 * PolicyPageError - Error state for policy pages
 */
export const PolicyPageError: React.FC<{
  type: "privacy" | "terms-use" | "terms-service";
  error: string;
}> = ({ type, error }) => {
  const defaultTitle = {
    privacy: "PRIVACY POLICY",
    "terms-use": "TERMS OF USE",
    "terms-service": "TERMS OF SERVICE",
  }[type];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold uppercase">{defaultTitle}</h1>
      </div>
      <p>This content is currently unavailable. Please check back later.</p>
      {error && <p className="text-destructive mt-2">Error: {error}</p>}
    </div>
  );
};

/**
 * PolicyPageLoading - Loading state for policy pages
 */
export const PolicyPageLoading: React.FC<{ type: "privacy" | "terms-use" | "terms-service" }> = ({
  type,
}) => {
  const defaultTitle = {
    privacy: "PRIVACY POLICY",
    "terms-use": "TERMS OF USE",
    "terms-service": "TERMS OF SERVICE",
  }[type];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold uppercase">{defaultTitle}</h1>
      </div>
      <LoadingContent spinnerClassName="h-12 w-12" fullHeight={false} />
    </div>
  );
};

export default PolicyPage;
