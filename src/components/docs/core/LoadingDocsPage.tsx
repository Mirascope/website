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
  // Left sidebar content
  const leftSidebar = <SidebarContainer product={product} />;

  // Main content (loading spinner)
  const mainContent = <LoadingContent fullHeight={true} />;

  // No right sidebar (TOC) during loading
  const rightSidebar = (
    <div className="w-56 h-full">
      <div className="animate-pulse mt-16 mx-4 h-6 bg-muted rounded-md"></div>
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
