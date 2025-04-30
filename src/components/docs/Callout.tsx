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
    containerClass: "border-primary",
    iconClass: "text-primary",
    Icon: AlertCircle,
  },
  info: {
    containerClass: "border-secondary",
    iconClass: "text-secondary",
    Icon: InfoIcon,
  },
  warning: {
    containerClass: "border-destructive",
    iconClass: "text-destructive",
    Icon: AlertTriangle,
  },
  success: {
    containerClass: "border-secondary",
    iconClass: "text-secondary",
    Icon: CheckCircle,
  },
  mira: {
    containerClass: "border-primary",
    iconClass: "text-primary",
    Icon: () => (
      <div className="flex items-center justify-center">
        <img src="/assets/branding/logo.webp" alt="Mirascope Logo" className="h-4 w-auto" />
      </div>
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
            "bg-accent/30 flex items-center gap-3 rounded-t-lg border-b px-3 py-2",
            containerClass.replace("border-", "border-b-"),
            collapsible && "cursor-pointer"
          )}
          onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
          aria-expanded={collapsible ? isOpen : undefined}
        >
          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", iconClass)}>
            <Icon className={cn(type === "mira" ? "" : "h-4 w-4")} />
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
