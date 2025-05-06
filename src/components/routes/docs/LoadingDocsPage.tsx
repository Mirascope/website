import React from "react";
import { AppLayout, LoadingContent, SEOMeta } from "@/src/components";
import { type ProductName } from "@/src/lib/content/spec";

interface LoadingDocsPageProps {
  product: ProductName;
}

/**
 * LoadingDocsPage - A simplified version of DocsPage for loading states
 *
 * Shows a loading spinner in place of the main content while maintaining the sidebar structure
 */
const LoadingDocsPage: React.FC<LoadingDocsPageProps> = ({ product }) => {
  return (
    <>
      <SEOMeta
        title="Loading..."
        description="Loading documentation content"
        url=""
        product={product}
      />
      <AppLayout>
        <AppLayout.LeftSidebar>
          <div className="px-4 py-2">
            <div className="bg-muted h-6 w-48 animate-pulse rounded-md"></div>
          </div>
        </AppLayout.LeftSidebar>

        <AppLayout.Content>
          <LoadingContent fullHeight={true} />
        </AppLayout.Content>

        <AppLayout.RightSidebar>
          <div className="h-full">
            <div className="bg-muted mx-4 mt-16 h-6 animate-pulse rounded-md"></div>
          </div>
        </AppLayout.RightSidebar>
      </AppLayout>
    </>
  );
};

export default LoadingDocsPage;
