import React from "react";
import { cn } from "@/src/lib/utils";

export type TOCItem = {
  id: string;
  text: string;
  level: number;
};

export interface TableOfContentsProps {
  headings: TOCItem[];
  activeId?: string;
}

/**
 * A table of contents component that renders a list of headings.
 * Takes explicit props instead of extracting content from the DOM.
 */
export const TableOfContents: React.FC<TableOfContentsProps> = ({ headings, activeId = "" }) => {
  if (headings.length === 0) {
    return <p className="text-muted-foreground pl-5 text-sm italic">No headings found</p>;
  }

  return (
    <div className="max-h-[calc(100vh-18rem)] overflow-y-auto">
      <div className="pl-4">
        <nav className="space-y-1">
          {headings.map((heading) => (
            <a
              key={heading.id}
              href={`#${heading.id}`}
              className={cn(
                "-ml-[1px] block truncate border-l-2 py-1 text-[13px] transition-colors",
                heading.level === 1 && "pl-2",
                heading.level === 2 && "pl-2",
                heading.level === 3 && "pl-4",
                heading.level === 4 && "pl-6",
                heading.level === 5 && "pl-8",
                heading.level === 6 && "pl-10",
                activeId === heading.id
                  ? "border-primary text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted border-transparent hover:rounded-md"
              )}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};
