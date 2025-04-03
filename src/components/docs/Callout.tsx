import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, Info as InfoIcon, CheckCircle, AlertTriangle } from "lucide-react";

type CalloutType = "note" | "warning" | "info" | "success";

interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const calloutStyles: Record<CalloutType, { containerClass: string; iconClass: string, Icon: React.ElementType }> = {
  note: {
    containerClass: "border-blue-500",
    iconClass: "bg-blue-500 text-white",
    Icon: InfoIcon
  },
  warning: {
    containerClass: "border-amber-500",
    iconClass: "bg-amber-500 text-white",
    Icon: AlertTriangle
  },
  info: {
    containerClass: "border-purple-500",
    iconClass: "bg-purple-500 text-white",
    Icon: AlertCircle
  },
  success: {
    containerClass: "border-green-500",
    iconClass: "bg-green-500 text-white",
    Icon: CheckCircle
  }
};

export function Callout({ type, title, children, className }: CalloutProps) {
  const { containerClass, iconClass, Icon } = calloutStyles[type];
  
  return (
    <div className={cn(
      "rounded-lg border my-6", 
      containerClass, 
      className
    )}>
      {/* Title bar */}
      <div className="flex items-center gap-3 py-2 px-3 border-b border-gray-700/20 bg-[#20253a] rounded-t-lg">
        <div className={cn("rounded-full flex items-center justify-center w-6 h-6", iconClass)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="font-semibold text-white text-base">
          {title || (type === "note" ? "Note" : type === "warning" ? "Warning" : type === "info" ? "Info" : "Success")}
        </div>
      </div>
      
      {/* Content */}
      <div className="px-6 py-5 text-gray-200 rounded-b-lg">
        {children}
      </div>
    </div>
  );
}

// Shorthand components
export function Note({ title, children, className }: Omit<CalloutProps, "type">) {
  return <Callout type="note" title={title} className={className}>{children}</Callout>;
}

export function Warning({ title, children, className }: Omit<CalloutProps, "type">) {
  return <Callout type="warning" title={title} className={className}>{children}</Callout>;
}

export function Info({ title, children, className }: Omit<CalloutProps, "type">) {
  return <Callout type="info" title={title} className={className}>{children}</Callout>;
}

export function Success({ title, children, className }: Omit<CalloutProps, "type">) {
  return <Callout type="success" title={title} className={className}>{children}</Callout>;
}