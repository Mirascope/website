import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, Info as InfoIcon, CheckCircle, AlertTriangle } from "lucide-react";

type CalloutType = "note" | "warning" | "info" | "success";

interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const calloutStyles: Record<
  CalloutType,
  { containerClass: string; iconClass: string; Icon: React.ElementType }
> = {
  note: {
    containerClass: "border-primary",
    iconClass: "bg-primary text-muted-foreground",
    Icon: InfoIcon,
  },
  warning: {
    containerClass: "border-button-primary",
    iconClass: "bg-orange-500 text-foreground",
    Icon: AlertTriangle,
  },
  info: {
    containerClass: "border-primary",
    iconClass: "bg-primary text-accent-foreground",
    Icon: AlertCircle,
  },
  success: {
    containerClass: "border-secondary",
    iconClass: "bg-secondary text-white",
    Icon: CheckCircle,
  },
};

export function Callout({
  type,
  title,
  children,
  className,
  collapsible = false,
  defaultCollapsed = false,
}: CalloutProps) {
  const { containerClass, iconClass, Icon } = calloutStyles[type];
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

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
            : "Success"
      : "";

  const displayTitle = title || defaultTitle;

  // Content styling changes based on whether we have a header
  const contentClassName = cn(
    "bg-accent",
    showHeader ? "px-3 py-1 rounded-b-lg" : "px-3 py-1 rounded-lg"
  );

  return (
    <div
      className={cn("rounded-lg border", showHeader ? "my-6" : "my-3", containerClass, className)}
    >
      {/* Title bar - only render if we need a header */}
      {showHeader && (
        <div
          className={cn(
            "flex items-center gap-3 py-2 px-3 border-b border-accent bg-primary rounded-t-lg",
            collapsible && "cursor-pointer"
          )}
          onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        >
          <div className={cn("rounded-full flex items-center justify-center w-6 h-6", iconClass)}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="font-semibold text-primary-foreground text-base flex-1">
            {displayTitle}
          </div>
          {collapsible && (
            <div className="text-accent-foreground">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn("transition-transform", isCollapsed ? "" : "transform rotate-180")}
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Content - only show if not collapsed */}
      {(!showHeader || !isCollapsed) && (
        <div className={cn(contentClassName, "callout-content")}>{children}</div>
      )}
    </div>
  );
}

// Shorthand components
export function Note({
  title,
  children,
  className,
  collapsible,
  defaultCollapsed,
}: Omit<CalloutProps, "type">) {
  return (
    <Callout
      type="note"
      title={title}
      className={className}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
    >
      {children}
    </Callout>
  );
}

export function Warning({
  title,
  children,
  className,
  collapsible,
  defaultCollapsed,
}: Omit<CalloutProps, "type">) {
  return (
    <Callout
      type="warning"
      title={title}
      className={className}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
    >
      {children}
    </Callout>
  );
}

export function Info({
  title,
  children,
  className,
  collapsible,
  defaultCollapsed,
}: Omit<CalloutProps, "type">) {
  return (
    <Callout
      type="info"
      title={title}
      className={className}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
    >
      {children}
    </Callout>
  );
}

export function Success({
  title,
  children,
  className,
  collapsible,
  defaultCollapsed,
}: Omit<CalloutProps, "type">) {
  return (
    <Callout
      type="success"
      title={title}
      className={className}
      collapsible={collapsible}
      defaultCollapsed={defaultCollapsed}
    >
      {children}
    </Callout>
  );
}
