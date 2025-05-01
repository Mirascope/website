import React from "react";
import BaseLayout from "@/src/components/BaseLayout";
import SidebarContainer from "@/src/components/SidebarContainer";
import useProviderSelection from "@/src/lib/hooks/useProviderSelection";
import { ProviderContextProvider } from "@/src/components/docs";
import TocSidebar from "./TocSidebar";
import MainContent from "./MainContent";
import DocsSidebar from "./DocsSidebar";
import SEOMeta from "@/src/components/SEOMeta";
import type { DocContent, ProductName } from "@/src/lib/content";

type DocsPageProps = {
  document: DocContent;
};

/**
 * DocsPage component - Top-level documentation page component
 *
 * Handles metadata, layout and content rendering for all documentation pages
 */
const DocsPage: React.FC<DocsPageProps> = ({ document }) => {
  // Extract metadata for SEO
  const meta = document.meta;
  const { title, path, description, product } = meta;
  const urlPath = `/docs/${path}`;

  // Use custom hooks for state management
  const [selectedProvider, handleProviderChange] = useProviderSelection();

  // Left sidebar content
  const leftSidebar = (
    <SidebarContainer>
      <DocsSidebar product={product as ProductName} />
    </SidebarContainer>
  );

  // Right sidebar content (TOC)
  const rightSidebar = <TocSidebar document={document} />;

  // Main content
  const mainContent = <MainContent document={document} />;

  return (
    <>
      <SEOMeta
        title={title}
        description={description}
        url={urlPath}
        product={product as ProductName}
      />
      <ProviderContextProvider
        defaultProvider={selectedProvider}
        onProviderChange={handleProviderChange}
      >
        <BaseLayout
          leftSidebar={leftSidebar}
          mainContent={mainContent}
          rightSidebar={rightSidebar}
        />
      </ProviderContextProvider>
    </>
  );
};

export default DocsPage;
