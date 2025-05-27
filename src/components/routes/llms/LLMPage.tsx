import React from "react";
import { AppLayout, PageMeta } from "@/src/components";
import { LLMContent } from "@/src/lib/content/llm-content";
import LLMRenderer from "./LLMRenderer";
import TocSidebar from "./TocSidebar";

interface LLMPageProps {
  content: LLMContent;
  txtPath: string;
  leftSidebar?: React.ReactNode;
  rightSidebarExtra?: React.ReactNode;
}

export default function LLMPage({
  content,
  txtPath,
  leftSidebar,
  rightSidebarExtra,
}: LLMPageProps) {
  return (
    <>
      <PageMeta title={content.title} description={content.description} />
      <AppLayout>
        {leftSidebar && <AppLayout.LeftSidebar>{leftSidebar}</AppLayout.LeftSidebar>}

        <AppLayout.Content>
          <div className="bg-background container mx-auto min-h-screen px-4">
            {/* Document header */}
            <h1
              className="mb-2 text-2xl font-bold"
              id="top"
              style={{ scrollMarginTop: "var(--header-height)" }}
            >
              {content.title}
            </h1>
            <p className="text-muted-foreground text-sm">
              Concatenated markdown docs, intended for use by LLMs. Copy it using the buttons, or
              navigate to{" "}
              <a href={txtPath} className="text-primary underline">
                {txtPath}
              </a>
              .
            </p>

            <div className="bg-card/20 border-border relative mt-4 overflow-hidden rounded-lg border">
              <LLMRenderer content={content} />
            </div>
          </div>
        </AppLayout.Content>

        <AppLayout.RightSidebar mobileCollapsible>
          {rightSidebarExtra}
          <TocSidebar content={content} />
        </AppLayout.RightSidebar>
      </AppLayout>
    </>
  );
}
