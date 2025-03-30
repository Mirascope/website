import React from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { DocMeta } from "@/lib/docs";

type DocsSidebarProps = {
  product: string;
  section: string;
  currentSlug: string;
  docs: DocMeta[];
};

const DocsSidebar: React.FC<DocsSidebarProps> = ({
  product,
  section,
  currentSlug,
  docs,
}) => {
  return (
    <aside className="h-full pt-6 pb-12">
      <div className="px-4 mb-6">
        {/* Product Switcher */}
        <div className="flex mb-5 space-x-4">
          <Link
            to={`/docs/mirascope/${section}/index`}
            className={cn(
              "text-xl font-medium cursor-pointer transition-colors",
              product === "mirascope"
                ? "text-mirascope-purple"
                : "text-gray-400 hover:text-gray-700"
            )}
          >
            Mirascope
          </Link>
          <Link
            to={`/docs/lilypad/${section}/index`}
            className={cn(
              "text-xl font-medium cursor-pointer transition-colors",
              product === "lilypad"
                ? "text-lilypad-green"
                : "text-gray-400 hover:text-gray-700"
            )}
          >
            Lilypad
          </Link>
        </div>

        {/* Section Tabs */}
        <div className="flex space-x-1 mb-6">
          <Link
            to={`/docs/${product}/main/index`}
            className={cn(
              "px-3 py-1.5 text-base rounded-md",
              section === "main"
                ? product === "mirascope"
                  ? "bg-mirascope-purple text-white"
                  : "bg-lilypad-green text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            Docs
          </Link>
          <Link
            to={`/docs/${product}/api/index`}
            className={cn(
              "px-3 py-1.5 text-base rounded-md",
              section === "api"
                ? product === "mirascope"
                  ? "bg-mirascope-purple text-white"
                  : "bg-lilypad-green text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            API
          </Link>
        </div>
      </div>

      <div className="px-4">
        <h4 className="text-sm uppercase tracking-wider text-gray-500 mb-3">
          {section === "main" ? "Documentation" : "API Reference"}
        </h4>
        <nav className="space-y-1">
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              to={`/docs/${product}/${section}/${doc.slug}`}
              className={cn(
                "block px-3 py-2 text-base rounded-md",
                currentSlug === doc.slug
                  ? product === "mirascope"
                    ? "bg-gray-100 text-mirascope-purple font-medium"
                    : "bg-gray-100 text-lilypad-green font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {doc.title}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default DocsSidebar;
