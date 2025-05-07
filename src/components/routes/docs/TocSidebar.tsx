import React, { useState } from "react";
import { TableOfContents } from "@/src/components";
import { Button } from "@/src/components/ui/button";
import { Server, Clipboard, Check } from "lucide-react";
import { ProviderDropdown } from "@/src/components/mdx/providers";
import { type DocContent } from "@/src/lib/content";
import analyticsManager from "@/src/lib/services/analytics";

interface TocSidebarProps {
  document?: DocContent | null;
}

/**
 * TocSidebar - Right sidebar containing the table of contents and controls
 *
 * Displays provider selection dropdown and table of contents
 */
const TocSidebar: React.FC<TocSidebarProps> = ({ document }) => {
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

          analyticsManager.trackCopyEvent({
            contentType: "document_markdown",
            itemId: document.meta.path,
            product: document.meta.product,
          });
        })
        .catch((err) => {
          console.error("Failed to copy content: ", err);
        });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-4">
        <div className="mb-4 flex flex-col gap-3">
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
                  <Check className="mr-1 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Clipboard className="mr-1 h-4 w-4" />
                  Copy as Markdown
                </>
              )}
            </Button>
          )}

          {/* Provider dropdown */}
          <div className="mt-3">
            <h4 className="text-muted-foreground mb-2 text-sm font-medium">
              <div className="flex items-center">
                <Server className="mr-1 h-3 w-3" />
                Provider
              </div>
            </h4>
            <ProviderDropdown />
          </div>

          <h4 className="text-muted-foreground mt-4 text-sm font-medium">On this page</h4>
        </div>
        <TableOfContents contentId="doc-content" path={document?.meta.path || ""} />
      </div>
    </div>
  );
};

export default TocSidebar;
