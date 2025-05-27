import { Button } from "@/src/components/ui/button";
import { ButtonLink } from "@/src/components/ui/button-link";
import type { LLMContent } from "@/src/lib/content/llm-content";
import { BASE_URL } from "@/src/lib/constants/site";
import { formatTokenCount, tokenBadge } from "./utils";
import { Clipboard, Rocket } from "lucide-react";

interface ContentActionsProps {
  item: LLMContent;
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
        <Clipboard className="mr-1 h-4 w-4" />
        Copy
      </Button>
      {showDocs && (
        <ButtonLink
          href={toRelativeUrl(`${BASE_URL}${item.route}`)}
          variant={variant}
          size={size}
          className="text-xs"
        >
          <Rocket className="mr-1 h-4 w-4" />
          Docs
        </ButtonLink>
      )}
    </div>
  );
}
