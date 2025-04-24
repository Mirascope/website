import React from "react";
import { MDXProvider } from "@mdx-js/react";
import { cn } from "@/src/lib/utils";
import {
  InstallSnippet,
  CodeSnippet,
  ProviderCodeBlock,
  Callout,
  Note,
  Warning,
  Info,
  Success,
  TabbedSection,
  Tab,
  MermaidDiagram,
} from "./docs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import Logo from "./Logo";
import { Underline } from "./Underline";
import { ProviderCodeWrapper } from "./ProviderCodeWrapper";
import { ResponsiveImage } from "./ResponsiveImage";
import { devComponents } from "./dev/DevComponents";

// Helper function to generate heading ID from text
const slugify = (text: string): string => {
  // Handle special cases that might cause issues
  if (!text) return "heading";

  // Normalize Unicode characters
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  return (
    normalized
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-") // Replace any non-alphanumeric chars with hyphens
      .replace(/(^-|-$)/g, "") // Remove leading/trailing hyphens
      .replace(/--+/g, "-") || // Replace multiple hyphens with one
    "heading"
  ); // Default to 'heading' if nothing remains
};

// Custom components that will be available in MDX files
export const components = {
  // Custom components for docs
  InstallSnippet,
  CodeSnippet,
  ProviderCodeBlock,
  TabbedSection,
  Tab,
  Callout,
  Note,
  Warning,
  Info,
  Success,
  MermaidDiagram,

  // UI Components
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Logo,

  // Dev components
  ...devComponents,

  // Shorthand components
  Install: InstallSnippet,
  U: Underline,

  // Standard HTML elements
  h1: ({ children, ...props }: React.ComponentPropsWithoutRef<"h1">) => {
    // Generate an ID from the text content if not provided
    const id = props.id || (typeof children === "string" ? slugify(children) : undefined);
    return (
      <h1 id={id} className="text-3xl font-bold my-6 scroll-mt-28" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ children, ...props }: React.ComponentPropsWithoutRef<"h2">) => {
    const id = props.id || (typeof children === "string" ? slugify(children) : undefined);
    return (
      <h2 id={id} className="text-2xl font-semibold my-5 scroll-mt-28" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ children, ...props }: React.ComponentPropsWithoutRef<"h3">) => {
    const id = props.id || (typeof children === "string" ? slugify(children) : undefined);
    return (
      <h3 id={id} className="text-xl font-medium my-4 scroll-mt-28" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ children, ...props }: React.ComponentPropsWithoutRef<"h4">) => {
    const id = props.id || (typeof children === "string" ? slugify(children) : undefined);
    return (
      <h4 id={id} className="text-lg font-medium my-3 scroll-mt-28" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ children, ...props }: React.ComponentPropsWithoutRef<"h5">) => {
    const id = props.id || (typeof children === "string" ? slugify(children) : undefined);
    return (
      <h5 id={id} className="text-base font-medium my-3 scroll-mt-28" {...props}>
        {children}
      </h5>
    );
  },
  p: (props: React.ComponentPropsWithoutRef<"p">) => <p className="my-3" {...props} />,
  a: (props: React.ComponentPropsWithoutRef<"a">) => (
    <a className="text-primary hover:underline no-underline" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc pl-5 my-4" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal pl-5 my-4" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<"li">) => <li className="mb-2" {...props} />,
  // Responsive image component
  img: (props: React.ComponentPropsWithoutRef<"img">) => <ResponsiveImage {...props} />,
  // Inline code - this is only for inline elements, not code blocks
  code: (props: React.ComponentPropsWithoutRef<"code">) => {
    // Don't apply inline code styling to code blocks (which are children of pre tags)
    const isInPre = React.useRef<boolean>(false);
    React.useLayoutEffect(() => {
      // Type assertion for DOM properties access
      const element = props as unknown as { parentElement?: { tagName: string } };
      const parentIsPre =
        props.className?.includes("language-") ||
        props.className?.includes("shiki") ||
        element.parentElement?.tagName === "PRE";
      isInPre.current = !!parentIsPre;
    }, [props]);

    // Only apply inline code styling to actual inline code, not code blocks
    if (isInPre.current) {
      return <code {...props} />;
    }

    return (
      <code
        className="bg-muted text-muted-foreground px-1 py-0.5 rounded text-[0.9em] font-mono"
        {...props}
      />
    );
  },

  // Code blocks - use our custom CodeBlock component with provider substitution
  pre: (props: React.ComponentPropsWithoutRef<"pre">) => {
    // Direct extraction approach that works with MDX's structure
    let codeContent = "";
    let language = "";
    let meta = "";

    // First try to extract from props directly
    if (props.className?.includes("language-")) {
      language = (props.className.match(/language-(\w+)/) || [])[1] || "";
      const metaMatch = props.className.match(/\{([^}]+)\}/);
      meta = metaMatch ? `{${metaMatch[1]}}` : "";

      if (typeof props.children === "string") {
        codeContent = props.children;
      }
    }

    // If no success with direct props, try to handle React children structure
    if (!codeContent && props.children) {
      const children = React.Children.toArray(props.children);

      // Loop through children to find code content
      for (const child of children) {
        if (!React.isValidElement(child)) continue;

        // Try to find language info in child's className
        // Use type assertion to ensure we can access props
        const childProps =
          (child.props as
            | {
                className?: string;
                children?: React.ReactNode | string;
              }
            | undefined) || {};

        if (childProps.className?.includes("language-")) {
          language = (childProps.className.match(/language-(\w+)/) || [])[1] || "";
          const metaMatch = childProps.className.match(/\{([^}]+)\}/);
          meta = metaMatch ? `{${metaMatch[1]}}` : "";

          // Extract code content from child
          if (typeof childProps.children === "string") {
            codeContent = childProps.children;
            break;
          }
        }

        // If child itself doesn't have the class but has children, try those
        if (!codeContent && childProps.children) {
          const grandchildren = React.Children.toArray(childProps.children);

          for (const grandchild of grandchildren) {
            if (!React.isValidElement(grandchild)) continue;

            // Type assertion for grandchild props
            const grandchildProps =
              (grandchild.props as
                | {
                    className?: string;
                    children?: React.ReactNode | string;
                  }
                | undefined) || {};

            if (grandchildProps.className?.includes("language-")) {
              language = (grandchildProps.className.match(/language-(\w+)/) || [])[1] || "";
              const metaMatch = grandchildProps.className.match(/\{([^}]+)\}/);
              meta = metaMatch ? `{${metaMatch[1]}}` : "";

              if (typeof grandchildProps.children === "string") {
                codeContent = grandchildProps.children;
                break;
              }
            }
          }

          if (codeContent) break;
        }
      }
    }

    // Handle mermaid diagrams
    if (language === "mermaid" && codeContent) {
      return <MermaidDiagram chart={codeContent.trim()} />;
    }

    // If we found code content and a language, use our ProviderCodeWrapper component
    if (codeContent) {
      return (
        <ProviderCodeWrapper
          code={codeContent.replace(/\n$/, "")}
          language={language}
          meta={meta}
        />
      );
    }

    // Fallback to standard pre if not a code block or couldn't extract content
    return (
      <pre
        className="rounded-lg p-4 my-6 bg-muted overflow-x-auto border border-border"
        {...props}
      />
    );
  },
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => <strong {...props} />,
  em: (props: React.ComponentPropsWithoutRef<"em">) => <em {...props} />,
  blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="border-l-4 border-border pl-4 my-4 italic" {...props} />
  ),
  table: (props: React.ComponentPropsWithoutRef<"table">) => (
    <table className="min-w-full divide-y divide-border my-6" {...props} />
  ),
  th: (props: React.ComponentPropsWithoutRef<"th">) => (
    <th className="px-4 py-2 bg-muted text-left text-sm font-medium" {...props} />
  ),
  td: (props: React.ComponentPropsWithoutRef<"td">) => (
    <td className="px-4 py-2 border-t border-border" {...props} />
  ),
  hr: (props: React.ComponentPropsWithoutRef<"hr">) => (
    <hr className="my-6 border-border" {...props} />
  ),
};

interface MDXProviderWrapperProps {
  children: React.ReactNode;
  useFunMode?: boolean;
}

export function MDXProviderWrapper({ children, useFunMode = false }: MDXProviderWrapperProps) {
  return (
    <div className={cn("mdx-content", useFunMode ? "fun-mode" : "")}>
      <MDXProvider components={components}>{children}</MDXProvider>
    </div>
  );
}
