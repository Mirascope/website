import React from "react";
import { MDXProvider } from "@mdx-js/react";
import { cn } from "@/lib/utils";
import {
  ProviderContextProvider,
  ProviderSelector,
  InstallSnippet,
  CodeSnippet,
  ApiStyleCodeBlock,
  ProviderCodeBlock,
} from "./docs";
import { CodeBlock } from "./CodeBlock";

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
  ProviderContextProvider,
  ProviderSelector,
  InstallSnippet,
  CodeSnippet,
  ApiStyleCodeBlock,
  ProviderCodeBlock,

  // Shorthand components
  Install: InstallSnippet,

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
    <a className="text-blue-600 dark:text-blue-400 hover:underline no-underline" {...props} />
  ),
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc pl-5 my-4" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal pl-5 my-4" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<"li">) => <li className="mb-2" {...props} />,
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
        className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm font-mono"
        {...props}
      />
    );
  },

  // Code blocks - use our custom CodeBlock component
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

    // If we found code content and a language, use our CodeBlock component
    if (codeContent) {
      return <CodeBlock code={codeContent.replace(/\n$/, "")} language={language} meta={meta} />;
    }

    // Fallback to standard pre if not a code block or couldn't extract content
    return (
      <pre
        className="rounded-lg p-4 my-6 bg-gray-100 dark:bg-gray-800 overflow-x-auto border border-gray-200 dark:border-gray-700"
        {...props}
      />
    );
  },
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => <strong {...props} />,
  em: (props: React.ComponentPropsWithoutRef<"em">) => <em {...props} />,
  blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote
      className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 my-4 italic"
      {...props}
    />
  ),
  table: (props: React.ComponentPropsWithoutRef<"table">) => (
    <table className="min-w-full divide-y divide-gray-200 my-6" {...props} />
  ),
  th: (props: React.ComponentPropsWithoutRef<"th">) => (
    <th
      className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium"
      {...props}
    />
  ),
  td: (props: React.ComponentPropsWithoutRef<"td">) => (
    <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700" {...props} />
  ),
  hr: (props: React.ComponentPropsWithoutRef<"hr">) => (
    <hr className="my-6 border-gray-200 dark:border-gray-700" {...props} />
  ),
};

interface MDXProviderWrapperProps {
  children: React.ReactNode;
  useFunMode?: boolean;
}

export function MDXProviderWrapper({ children, useFunMode = false }: MDXProviderWrapperProps) {
  return (
    <div className={cn(useFunMode ? "fun-mode" : "")}>
      <MDXProvider components={components}>{children}</MDXProvider>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* Base styles for content - Sans-serif font */
          .mdx-content {
            font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
            font-size: 1.0rem !important;
          }
          
          /* All standard text elements use sans font in normal mode */
          .mdx-content h1, 
          .mdx-content h2, 
          .mdx-content h3, 
          .mdx-content h4, 
          .mdx-content h5, 
          .mdx-content h6, 
          .mdx-content p, 
          .mdx-content a, 
          .mdx-content li, 
          .mdx-content blockquote, 
          .mdx-content table { 
            font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
          }
          
          /* Code elements always use monospace in all modes */
          .mdx-content pre,
          .mdx-content code,
          .mdx-content .shiki,
          .mdx-content .shiki code,
          .mdx-content .shiki .line {
            font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
            font-size: 0.9rem !important;
          }
          
          /* Fun mode (handwriting) styles - need high specificity to override defaults */
          .mdx-content.fun-mode h1, 
          .mdx-content.fun-mode h2, 
          .mdx-content.fun-mode h3, 
          .mdx-content.fun-mode h4, 
          .mdx-content.fun-mode h5, 
          .mdx-content.fun-mode h6, 
          .mdx-content.fun-mode p, 
          .mdx-content.fun-mode strong,
          .mdx-content.fun-mode em,
          .mdx-content.fun-mode b,
          .mdx-content.fun-mode i,
          .mdx-content.fun-mode a, 
          .mdx-content.fun-mode li, 
          .mdx-content.fun-mode div,
          .mdx-content.fun-mode span,
          .mdx-content.fun-mode blockquote, 
          .mdx-content.fun-mode table,
          .mdx-content.fun-mode * {
            font-family: 'Williams Handwriting', cursive !important;
            font-size: 1.2rem !important;
          }
          
          /* Fun mode - make sure code elements also use handwriting with highest specificity */
          .mdx-content.fun-mode pre,
          .mdx-content.fun-mode code,
          .mdx-content.fun-mode .shiki,
          .mdx-content.fun-mode .shiki code,
          .mdx-content.fun-mode .shiki .line,
          .mdx-content.fun-mode .shiki * {
            font-family: 'Williams Handwriting', cursive !important;
            font-size: 1.2rem !important;
          }
          
          /* Additional styles for code highlighting */
          .mdx-content .shiki code span {
            font-family: inherit !important;
            font-size: inherit !important;
          }
          
          /* Additional list styling */
          .mdx-content ul li:last-child,
          .mdx-content ol li:last-child {
            margin-bottom: 0 !important;
          }
          
          /* Code block styling */
          .mdx-content pre {
            border-radius: 0.375rem !important;
            padding: 1rem !important;
            background-color: #f3f4f6 !important;
            overflow-x: auto !important;
          }
          
          .dark .mdx-content pre {
            background-color: #1f2937 !important;
          }
        `,
        }}
      />
    </div>
  );
}
