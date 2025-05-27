import { LLMContent } from "@/src/lib/content/llm-content";
import ContentActions from "./ContentActions";
import LLMRenderer from "./LLMRenderer";

interface LLMContainerProps {
  content: LLMContent;
  level?: number;
}

export default function LLMContainer({ content, level = 1 }: LLMContainerProps) {
  const sectionId = `section-${content.slug}`;

  return (
    <div key={sectionId}>
      <div
        id={sectionId}
        className="border-border mb-6 border-b pt-2"
        style={{ scrollMarginTop: "var(--header-height)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className={`px-2 font-bold ${level === 1 ? "text-2xl" : "text-xl"}`}>
              {content.title}
            </h2>
            {content.description && (
              <span className="text-muted-foreground text-sm">{content.description}</span>
            )}
          </div>
          <ContentActions item={content} />
        </div>
      </div>

      {/* Render children */}
      {content.getChildren().map((child) => (
        <LLMRenderer key={child.slug} content={child} level={level + 1} />
      ))}
    </div>
  );
}
