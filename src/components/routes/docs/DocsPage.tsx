import React from "react";
import { AppLayout, SEOMeta } from "@/src/components";
import useProviderSelection from "@/src/lib/hooks/useProviderSelection";
import { ProviderContextProvider } from "@/src/components";
import TocSidebar from "./TocSidebar";
import MainContent from "./MainContent";
import DocsSidebar from "./DocsSidebar";
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
        <AppLayout>
          <AppLayout.LeftSidebar className="pt-1">
            <DocsSidebar product={product as ProductName} />
          </AppLayout.LeftSidebar>

          <AppLayout.Content>
            <MainContent document={document} />
          </AppLayout.Content>

          <AppLayout.RightSidebar className="pt-1">
            <TocSidebar document={document} />
          </AppLayout.RightSidebar>
        </AppLayout>
      </ProviderContextProvider>
    </>
  );
};

export default DocsPage;
