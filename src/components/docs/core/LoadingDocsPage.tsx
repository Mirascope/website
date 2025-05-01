import React from "react";
import BaseLayout from "@/src/components/BaseLayout";
import SidebarContainer from "@/src/components/SidebarContainer";
import { type ProductName } from "@/src/lib/content/spec";
import LoadingContent from "./LoadingContent";
import SEOMeta from "@/src/components/SEOMeta";

interface LoadingDocsPageProps {
  product: ProductName;
}

/**
 * LoadingDocsPage - A simplified version of DocsPage for loading states
 *
 * Shows a loading spinner in place of the main content while maintaining the sidebar structure
 */
const LoadingDocsPage: React.FC<LoadingDocsPageProps> = ({ product }) => {
  // Left sidebar content with loading placeholder
  const leftSidebar = (
    <SidebarContainer>
      <div className="px-4 py-2">
        <div className="bg-muted h-6 w-48 animate-pulse rounded-md"></div>
      </div>
    </SidebarContainer>
  );

  // Main content (loading spinner)
  const mainContent = <LoadingContent fullHeight={true} />;

  // No right sidebar (TOC) during loading
  const rightSidebar = (
    <div className="h-full w-56">
      <div className="bg-muted mx-4 mt-16 h-6 animate-pulse rounded-md"></div>
    </div>
  );

  return (
    <>
      <SEOMeta
        title="Loading..."
        description="Loading documentation content"
        url=""
        product={product}
      />
      <BaseLayout leftSidebar={leftSidebar} mainContent={mainContent} rightSidebar={rightSidebar} />
    </>
  );
};

export default LoadingDocsPage;
