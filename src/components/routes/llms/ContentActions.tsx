import { Button } from "@/src/components/ui/button";
import { ButtonLink } from "@/src/components/ui/button-link";
import type { ContentItem } from "@/src/lib/content/llm-documents";
import { BASE_URL } from "@/src/lib/constants/site";
import { formatTokenCount, tokenBadge } from "./utils";

interface ContentActionsProps {
  item: ContentItem;
  toRelativeUrl: (url: string) => string;
  size?: "sm" | "default";
  variant?: "ghost" | "outline";
  showDocs?: boolean;
}

export default function ContentActions({
  item,
  toRelativeUrl,
  size = "sm",
  variant = "ghost",
  showDocs = true,
}: ContentActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={tokenBadge}>{formatTokenCount(item.tokenCount)} tokens</span>
      <Button
        onClick={() => navigator.clipboard.writeText(item.getContent())}
        variant={variant}
        size={size}
        className="text-xs"
      >
        Copy
      </Button>
      {showDocs && (
        <ButtonLink
          href={toRelativeUrl(`${BASE_URL}${item.routePath}`)}
          variant={variant}
          size={size}
          className="text-xs"
        >
          Docs
        </ButtonLink>
      )}
    </div>
  );
}
