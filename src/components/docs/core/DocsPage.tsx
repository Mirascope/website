import React from "react";
import BaseLayout from "@/src/components/BaseLayout";
import SidebarContainer from "@/src/components/SidebarContainer";
import useFunMode from "@/src/lib/hooks/useFunMode";
import useProviderSelection from "@/src/lib/hooks/useProviderSelection";
import { ProviderContextProvider } from "@/src/components/docs";
import TocSidebar from "./TocSidebar";
import MainContent from "./MainContent";
import SEOMeta from "@/src/components/SEOMeta";
import { type ProductName } from "@/src/lib/route-types";
import type { DocContent } from "@/src/lib/content/docs";

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
  const [funMode, toggleFunMode] = useFunMode();
  const [selectedProvider, handleProviderChange] = useProviderSelection();

  // Left sidebar content
  const leftSidebar = <SidebarContainer product={product as ProductName} />;

  // Right sidebar content (TOC)
  const rightSidebar = (
    <TocSidebar funMode={funMode} toggleFunMode={toggleFunMode} document={document} />
  );

  // Main content
  const mainContent = <MainContent document={document} funMode={funMode} />;

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
