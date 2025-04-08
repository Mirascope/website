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
    containerClass: "border-blue-500",
    iconClass: "bg-blue-500 text-white",
    Icon: InfoIcon,
  },
  warning: {
    containerClass: "border-amber-500",
    iconClass: "bg-amber-500 text-white",
    Icon: AlertTriangle,
  },
  info: {
    containerClass: "border-mirascope-purple",
    iconClass: "bg-mirascope-purple text-white",
    Icon: AlertCircle,
  },
  success: {
    containerClass: "border-green-500",
    iconClass: "bg-green-500 text-white",
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

  const defaultTitle =
    type === "note"
      ? "Note"
      : type === "warning"
        ? "Warning"
        : type === "info"
          ? "Info"
          : "Success";

  const displayTitle = title || defaultTitle;

  return (
    <div className={cn("rounded-lg border my-6", containerClass, className)}>
      {/* Title bar */}
      <div
        className={cn(
          "flex items-center gap-3 py-2 px-3 border-b border-gray-700/20 bg-gray-100 dark:bg-[#20253a] sunset:bg-amber-100 rounded-t-lg",
          collapsible && "cursor-pointer"
        )}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
      >
        <div className={cn("rounded-full flex items-center justify-center w-6 h-6", iconClass)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="font-semibold text-gray-800 dark:text-white sunset:text-gray-800 text-base flex-1">
          {displayTitle}
        </div>
        {collapsible && (
          <div className="text-gray-500 dark:text-gray-400">
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

      {/* Content */}
      {!isCollapsed && (
        <div className="px-3 py-1 bg-gray-50/95 dark:bg-transparent sunset:bg-amber-50/90 text-gray-800 dark:text-gray-200 sunset:text-gray-800 rounded-b-lg">
          {children}
        </div>
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
