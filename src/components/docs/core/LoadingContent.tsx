import React from "react";

interface LoadingContentProps {
  className?: string;
  spinnerClassName?: string;
  fullHeight?: boolean;
}

/**
 * LoadingContent - A reusable loading spinner component
 *
 * Shows a centered loading spinner with configurable container and spinner styles
 */
const LoadingContent: React.FC<LoadingContentProps> = ({
  className = "",
  spinnerClassName = "h-12 w-12",
  fullHeight = true,
}) => {
  return (
    <div
      className={`flex justify-center items-center ${fullHeight ? "h-[calc(100vh-136px)]" : "py-20"} ${className}`}
    >
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 border-primary ${spinnerClassName}`}
      ></div>
    </div>
  );
};

export default LoadingContent;
