import React from "react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface ErrorContentProps {
  title?: string;
  message: string | null;
  showBackButton?: boolean;
  backTo?: string;
  backLabel?: string;
  children?: ReactNode;
}

/**
 * ErrorContent - A reusable error display component
 *
 * Shows error information with optional back button and debug details
 */
const ErrorContent: React.FC<ErrorContentProps> = ({
  title = "Not Found",
  message,
  showBackButton = false,
  backTo = "",
  backLabel = "Back",
  children,
}) => {
  return (
    <div className="flex-1 min-w-0 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        {showBackButton && (
          <div className="mb-6">
            <Link to={backTo} className="inline-block">
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                {backLabel}
              </Button>
            </Link>
          </div>
        )}

        <h1 className="text-2xl font-medium mb-4">{title}</h1>

        {message && <p className="text-gray-500 dark:text-gray-400 mb-4">{message}</p>}

        {children}
      </div>
    </div>
  );
};

export default ErrorContent;
