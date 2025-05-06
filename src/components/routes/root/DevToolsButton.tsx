import React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/src/lib/utils";
import { environment } from "@/src/lib/content/environment";

interface DevToolsButtonProps {
  className?: string;
}

const DevToolsButton: React.FC<DevToolsButtonProps> = ({ className }) => {
  // Only render in development mode
  if (!environment.isDev()) {
    return null;
  }

  return (
    <Link
      to="/dev"
      className={cn(
        "border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm",
        className
      )}
    >
      Dev Tools
    </Link>
  );
};

export default DevToolsButton;
