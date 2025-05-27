import { AppLayout, PageMeta } from "@/src/components";
import { LLMContent } from "@/src/lib/content/llm-content";
import LLMDocument from "./LLMDocument";
import TocSidebar from "./TocSidebar";

interface LLMPageProps {
  content: LLMContent;
  txtPath: string;
}

export default function LLMPage({ content, txtPath }: LLMPageProps) {
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
