import React from "react";
import BaseLayout from "@/src/components/BaseLayout";
import SidebarContainer from "@/src/components/SidebarContainer";
import useFunMode from "@/src/lib/hooks/useFunMode";
import useProviderSelection from "@/src/lib/hooks/useProviderSelection";
import { ProviderContextProvider } from "@/src/components/docs";
import TocSidebar from "./TocSidebar";
import MainContent from "./MainContent";
import { type ProductName } from "@/src/lib/route-types";

import type { DocContent } from "@/src/lib/content/docs";

type DocsLayoutProps = {
  document: DocContent;
};

/**
 * DocsLayout - Shared layout for all documentation pages
 *
 * Handles the common layout between all doc page types
 * (product index, regular docs, API docs)
 */
const DocsLayout: React.FC<DocsLayoutProps> = ({ document }) => {
  // Use custom hooks for state management
  const [funMode, toggleFunMode] = useFunMode();
  const [selectedProvider, handleProviderChange] = useProviderSelection();

  // Left sidebar content
  const leftSidebar = <SidebarContainer product={document.meta.product as ProductName} />;

  // Right sidebar content (TOC)
  const rightSidebar = (
    <TocSidebar funMode={funMode} toggleFunMode={toggleFunMode} document={document} />
  );

  // Main content
  const mainContent = <MainContent document={document} funMode={funMode} />;

  return (
    <ProviderContextProvider
      defaultProvider={selectedProvider}
      onProviderChange={handleProviderChange}
    >
      <BaseLayout leftSidebar={leftSidebar} mainContent={mainContent} rightSidebar={rightSidebar} />
    </ProviderContextProvider>
  );
};

export default DocsLayout;
