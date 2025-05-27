import { AppLayout, PageMeta } from "@/src/components";
import { LLMContent } from "@/src/lib/content/llm-content";
import LLMDocument from "./LLMDocument";
import TocSidebar from "./TocSidebar";

interface DocPageProps {
  content: LLMContent;
  txtPath: string;
}

export default function DocPage({ content, txtPath }: DocPageProps) {
  return (
    <>
      <PageMeta title={content.title} description={content.description} />
      <AppLayout>
        <AppLayout.Content>
          <LLMDocument content={content} txtPath={txtPath} />
        </AppLayout.Content>

        <AppLayout.RightSidebar mobileCollapsible>
          <TocSidebar content={content} />
        </AppLayout.RightSidebar>
      </AppLayout>
    </>
  );
}
