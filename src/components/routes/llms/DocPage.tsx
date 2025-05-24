import { AppLayout, PageMeta } from "@/src/components";
import { LLMDocument } from "@/src/lib/content/llm-documents";
import MainContent from "./MainContent";
import TocSidebar from "./TocSidebar";

interface DocPageProps {
  document: LLMDocument;
  txtPath: string;
}

export default function DocPage({ document, txtPath }: DocPageProps) {
  return (
    <>
      <PageMeta
        title={document.metadata.title}
        description={document.metadata.description}
        url={document.metadata.routePath}
      />
      <AppLayout>
        <AppLayout.Content>
          <MainContent document={document} txtPath={txtPath} />
        </AppLayout.Content>

        <AppLayout.RightSidebar mobileCollapsible>
          <TocSidebar document={document} />
        </AppLayout.RightSidebar>
      </AppLayout>
    </>
  );
}
