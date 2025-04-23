import React from "react";
import BaseLayout from "@/src/components/BaseLayout";
import SidebarContainer from "@/src/components/SidebarContainer";
import { type DocMeta } from "@/src/lib/content/docs";
import { type ProductName } from "@/src/lib/route-types";
import useFunMode from "@/src/lib/hooks/useFunMode";
import useProviderSelection from "@/src/lib/hooks/useProviderSelection";
import { ProviderContextProvider } from "@/src/components/docs";
import TocSidebar from "./TocSidebar";
import MainContent from "./MainContent";

import type { DocContent } from "@/src/lib/content/docs";

type DocsLayoutProps = {
  product: ProductName;
  section: string | null;
  slug: string;
  group: string | null;
  document: DocContent;
  docs: DocMeta[];
};

/**
 * DocsLayout - Shared layout for all documentation pages
 *
 * Handles the common layout between all doc page types
 * (product index, regular docs, API docs)
 */
const DocsLayout: React.FC<DocsLayoutProps> = ({
  product,
  section,
  slug,
  group = null,
  document,
  docs,
}) => {
  // Use custom hooks for state management
  const [funMode, toggleFunMode] = useFunMode();
  const [selectedProvider, handleProviderChange] = useProviderSelection();

  // Left sidebar content
  const leftSidebar = (
    <SidebarContainer product={product} section={section} slug={slug} group={group} docs={docs} />
  );

  // Right sidebar content (TOC)
  const rightSidebar = (
    <TocSidebar
      product={product}
      section={section}
      slug={slug}
      funMode={funMode}
      toggleFunMode={toggleFunMode}
      document={document}
    />
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
