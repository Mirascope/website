import { AppLayout, PageMeta } from "@/src/components";
import { LLMContent } from "@/src/lib/content/llm-content";
import MainContent from "./MainContent";
import TocSidebar from "./TocSidebar";

interface DocPageProps {
  document: LLMContent;
  txtPath: string;
}

export default function DocPage({ document, txtPath }: DocPageProps) {
  return (
    <>
      <PageMeta title={document.title} description={document.description} />
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
