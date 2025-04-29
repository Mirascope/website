import { cn } from "@/src/lib/utils";
import {
  AlertCircle,
  Info as InfoIcon,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";

type CalloutType = "note" | "warning" | "info" | "success" | "mira";

interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

const calloutStyles: Record<
  CalloutType,
  { containerClass: string; iconClass: string; Icon: React.ElementType }
> = {
  note: {
    containerClass: "border-muted",
    iconClass: "bg-muted/30 text-muted-foreground",
    Icon: InfoIcon,
  },
  info: {
    containerClass: "border-primary",
    iconClass: "bg-primary/30 text-primary",
    Icon: AlertCircle,
  },
  warning: {
    containerClass: "border-destructive",
    iconClass: "bg-destructive/30 text-destructive",
    Icon: AlertTriangle,
  },
  success: {
    containerClass: "border-secondary",
    iconClass: "bg-secondary/30 text-secondary",
    Icon: CheckCircle,
  },
  mira: {
    containerClass: "border-accent",
    iconClass: "bg-accent/30 text-accent-foreground",
    Icon: () => (
      <svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor">
        <path d="M256,0C114.6,0,0,114.6,0,256s114.6,256,256,256s256-114.6,256-256S397.4,0,256,0z M256,448 c-105.9,0-192-86.1-192-192S150.1,64,256,64s192,86.1,192,192S361.9,448,256,448z M256,128c-17.7,0-32,14.3-32,32 s14.3,32,32,32s32-14.3,32-32S273.7,128,256,128z M96,224c-17.7,0-32,14.3-32,32s14.3,32,32,32s32-14.3,32-32 S113.7,224,96,224z M416,224c-17.7,0-32,14.3-32,32s14.3,32,32,32s32-14.3,32-32S433.7,224,416,224z M320,384 c0-35.3-28.7-64-64-64s-64,28.7-64,64H320z" />
      </svg>
    ),
  },
};

export function Callout({
  type,
  title,
  children,
  className,
  collapsible = false,
  defaultOpen = true,
}: CalloutProps) {
  const { containerClass, iconClass, Icon } = calloutStyles[type];
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Determine if we should show a header
  const showHeader = collapsible || title !== undefined;

  // Only use default title if we need a header but no title was provided
  const defaultTitle =
    showHeader && title === undefined
      ? type === "note"
        ? "Note"
        : type === "warning"
          ? "Warning"
          : type === "info"
            ? "Info"
            : type === "success"
              ? "Success"
              : "Mirascope"
      : "";

  const displayTitle = title || defaultTitle;

  // Content styling changes based on whether we have a header
  const contentClassName = cn("px-3 py-2", showHeader ? "rounded-b-lg" : "rounded-lg");

  return (
    <div className={cn("my-4 rounded-lg border", containerClass, className)}>
      {/* Title bar - only render if we need a header */}
      {showHeader && (
        <div
          className={cn(
            "border-border bg-background flex items-center gap-3 rounded-t-lg border-b px-3 py-2",
            collapsible && "cursor-pointer"
          )}
          onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
          aria-expanded={collapsible ? isOpen : undefined}
        >
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", iconClass)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 text-base font-semibold">{displayTitle}</div>
          {collapsible && (
            <div className="text-foreground">
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", !isOpen ? "" : "rotate-180")}
              />
            </div>
          )}
        </div>
      )}

      {/* Content - only show if not collapsed */}
      {(!showHeader || isOpen) && (
        <div className={cn(contentClassName, "callout-content bg-background")}>{children}</div>
      )}
    </div>
  );
}

// Shorthand components
export function Note(props: Omit<CalloutProps, "type">) {
  return <Callout type="note" {...props} />;
}

export function Warning(props: Omit<CalloutProps, "type">) {
  return <Callout type="warning" {...props} />;
}

export function Info(props: Omit<CalloutProps, "type">) {
  return <Callout type="info" {...props} />;
}

export function Success(props: Omit<CalloutProps, "type">) {
  return <Callout type="success" {...props} />;
}

export function Mira(props: Omit<CalloutProps, "type">) {
  return <Callout type="mira" {...props} />;
}
