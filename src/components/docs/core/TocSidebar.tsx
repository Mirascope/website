import React, { useState } from "react";
import TableOfContents from "@/src/components/TableOfContents";
import { Button } from "@/src/components/ui/button";
import { Sparkles, Server, Clipboard, Check } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { ProviderDropdown } from "@/src/components/docs";
import { type DocContent } from "@/src/lib/content/docs";
import analyticsManager from "@/src/lib/services/analytics";

interface TocSidebarProps {
  funMode: boolean;
  toggleFunMode: () => void;
  document?: DocContent | null;
}

/**
 * TocSidebar - Right sidebar containing the table of contents and controls
 *
 * Displays fun mode toggle, provider selection dropdown, and table of contents
 */
const TocSidebar: React.FC<TocSidebarProps> = ({ funMode, toggleFunMode, document }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyContentAsMarkdown = () => {
    if (document?.content) {
      navigator.clipboard
        .writeText(document.content)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => {
            setIsCopied(false);
          }, 2000);

          const pagePath = window.location.pathname;
          // Using GA4 standard "select_content" event with recommended parameters
          analyticsManager.trackEvent("select_content", {
            content_type: "document_markdown",
            item_id: document.meta.path,
            product: document.meta.product,
            page_path: pagePath,
          });
        })
        .catch((err) => {
          console.error("Failed to copy content: ", err);
        });
    }
  };

  return (
    <div className="w-56 flex-shrink-0 hidden lg:block">
      <div className="fixed w-56 top-[60px] max-h-[calc(100vh-60px)] overflow-y-auto">
        <div className="px-4 pt-12">
          <div className="flex flex-col gap-3 mb-4">
            <Button
              variant={funMode ? "default" : "outline"}
              size="sm"
              onClick={toggleFunMode}
              className={cn(
                funMode ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                "transition-colors w-full"
              )}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Fun Mode
            </Button>

            {document && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyContentAsMarkdown}
                disabled={isCopied}
                className="w-full"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Clipboard className="w-4 h-4 mr-1" />
                    Copy as Markdown
                  </>
                )}
              </Button>
            )}

            {/* Provider dropdown */}
            <div className="mt-3">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                <div className="flex items-center">
                  <Server className="w-3 h-3 mr-1" />
                  Provider
                </div>
              </h4>
              <ProviderDropdown />
            </div>

            <h4 className="text-sm font-medium text-muted-foreground mt-4">On this page</h4>
          </div>
          <TableOfContents
            contentId="doc-content"
            product={document?.meta.product || "mirascope"}
            path={document?.meta.path || ""}
          />
        </div>
      </div>
    </div>
  );
};

export default TocSidebar;
