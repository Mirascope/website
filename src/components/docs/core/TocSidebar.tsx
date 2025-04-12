import React from "react";
import TableOfContents from "@/components/TableOfContents";
import { Button } from "@/components/ui/button";
import { Sparkles, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProviderDropdown } from "@/components/docs";
import { type ProductName } from "@/lib/route-types";

interface TocSidebarProps {
  product: ProductName;
  section: string | null;
  slug: string;
  funMode: boolean;
  toggleFunMode: () => void;
}

/**
 * TocSidebar - Right sidebar containing the table of contents and controls
 *
 * Displays fun mode toggle, provider selection dropdown, and table of contents
 */
const TocSidebar: React.FC<TocSidebarProps> = ({
  product,
  section,
  slug,
  funMode,
  toggleFunMode,
}) => {
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
                funMode ? "bg-primary text-white" : "hover:bg-purple-50",
                "transition-colors w-full"
              )}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Fun Mode
            </Button>

            {/* Provider dropdown */}
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                <div className="flex items-center">
                  <Server className="w-3 h-3 mr-1" />
                  Provider
                </div>
              </h4>
              <ProviderDropdown />
            </div>

            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-4">
              On this page
            </h4>
          </div>
          <TableOfContents
            contentId="doc-content"
            product={product}
            section={section}
            slug={slug}
          />
        </div>
      </div>
    </div>
  );
};

export default TocSidebar;
