import React from "react";
import { AppLayout, SEOMeta, LoadingContent, ProviderContextProvider } from "@/src/components";
import TocSidebar from "./TocSidebar";
import MainContent from "./MainContent";
import DocsSidebar from "./DocsSidebar";
import type { DocContent, ProductName } from "@/src/lib/content";

type DocsPageProps = {
  document?: DocContent;
  isLoading?: boolean;
  product: ProductName;
};

/**
 * DocsPage component - Top-level documentation page component
 *
 * Handles metadata, layout and content rendering for all documentation pages
 * Supports both loaded and loading states
 */
const DocsPage: React.FC<DocsPageProps> = ({ document, isLoading = false, product }) => {
  // Extract metadata for SEO (use defaults when loading)
  const meta = document?.meta || {
    title: "Loading...",
    path: "",
    description: "Loading documentation content",
  };
  const { title, path, description } = meta;
  const urlPath = path ? `/docs/${path}` : "";

  return (
    <>
      <SEOMeta title={title} description={description} url={urlPath} product={product} />

      <ProviderContextProvider>
        <AppLayout>
          <AppLayout.LeftSidebar className="pt-1" collapsible={true}>
            <DocsSidebar product={product} />
          </AppLayout.LeftSidebar>

          <AppLayout.Content>
            {isLoading ? (
              <LoadingContent fullHeight={true} />
            ) : (
              document && <MainContent document={document} />
            )}
          </AppLayout.Content>

          <AppLayout.RightSidebar
            className={isLoading ? undefined : "pt-1"}
            mobileCollapsible={true}
            mobileTitle="On this page"
          >
            {isLoading ? (
              <div className="h-full">
                <div className="bg-muted mx-4 mt-16 h-6 animate-pulse rounded-md"></div>
              </div>
            ) : (
              document && <TocSidebar document={document} />
            )}
          </AppLayout.RightSidebar>
        </AppLayout>
      </ProviderContextProvider>
    </>
  );
};

export default DocsPage;
