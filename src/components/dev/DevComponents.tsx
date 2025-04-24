import React from "react";
import type { DevMeta } from "@/src/lib/content";

// Color theme display component from style-test.tsx
export interface ColorThemeDisplayProps {
  bgColors?: string[];
  textColors?: string[];
}

export const ColorThemeDisplay: React.FC<ColorThemeDisplayProps> = ({
  bgColors = ["bg-background", "bg-muted", "bg-primary", "bg-secondary", "bg-accent"],
  textColors = [
    "text-foreground",
    "text-primary",
    "text-secondary",
    "text-accent-foreground",
    "text-muted-foreground",
  ],
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-6">
      {bgColors.map((bgColor) => (
        <div key={bgColor} className={`border rounded-lg shadow-sm ${bgColor}`}>
          <h3 className="px-3 pt-3 text-md font-medium block">{bgColor}</h3>
          <div className="p-3 space-y-2">
            {textColors.map((textColor) => (
              <div
                key={`${bgColor}-${textColor}`}
                className={`w-full h-8 ${textColor} flex items-center justify-center font-sm`}
              >
                {textColor}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Component to display dev pages
export const DevPagesList: React.FC<{ devPages: DevMeta[] }> = ({ devPages }) => {
  return (
    <div className="space-y-4">
      {devPages.map((page) => (
        <div key={page.slug} className="border rounded-lg p-6 shadow-sm">
          <a href={`/dev/${page.slug}`} className="hover:underline">
            <h2 className="text-xl font-semibold mb-2 text-primary">{page.title}</h2>
          </a>
          <p className="mb-4">{page.description}</p>
        </div>
      ))}
    </div>
  );
};

// Export all dev components
export const devComponents = {
  ColorThemeDisplay,
  DevPagesList,
};
