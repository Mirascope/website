import React from 'react';
import { MDXProvider } from '@mdx-js/react';
import { cn } from '@/lib/utils';
import { ProviderContextProvider, ProviderSelector, InstallSnippet, CodeSnippet, OSSelector, OSContextProvider } from './docs';

// Helper function to generate heading ID from text
const slugify = (text: string): string => {
  // Handle special cases that might cause issues
  if (!text) return "heading";
  
  // Normalize Unicode characters
  const normalized = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  return normalized
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace any non-alphanumeric chars with hyphens
    .replace(/(^-|-$)/g, '')     // Remove leading/trailing hyphens
    .replace(/--+/g, '-')        // Replace multiple hyphens with one
    || 'heading';                // Default to 'heading' if nothing remains
};

// Custom components that will be available in MDX files
export const components = {
  // Custom components for docs
  ProviderContextProvider,
  ProviderSelector,
  InstallSnippet,
  CodeSnippet,
  OSSelector,
  OSContextProvider,
  
  // Shorthand components
  Install: InstallSnippet,
  
  // Standard HTML elements
  h1: ({ children, ...props }: React.ComponentPropsWithoutRef<'h1'>) => {
    // Generate an ID from the text content if not provided
    const id = props.id || (typeof children === 'string' ? slugify(children) : undefined);
    return <h1 id={id} className="text-3xl font-bold my-6 scroll-mt-28" {...props}>{children}</h1>;
  },
  h2: ({ children, ...props }: React.ComponentPropsWithoutRef<'h2'>) => {
    const id = props.id || (typeof children === 'string' ? slugify(children) : undefined);
    return <h2 id={id} className="text-2xl font-semibold my-5 scroll-mt-28" {...props}>{children}</h2>;
  },
  h3: ({ children, ...props }: React.ComponentPropsWithoutRef<'h3'>) => {
    const id = props.id || (typeof children === 'string' ? slugify(children) : undefined);
    return <h3 id={id} className="text-xl font-medium my-4 scroll-mt-28" {...props}>{children}</h3>;
  },
  h4: ({ children, ...props }: React.ComponentPropsWithoutRef<'h4'>) => {
    const id = props.id || (typeof children === 'string' ? slugify(children) : undefined);
    return <h4 id={id} className="text-lg font-medium my-3 scroll-mt-28" {...props}>{children}</h4>;
  },
  h5: ({ children, ...props }: React.ComponentPropsWithoutRef<'h5'>) => {
    const id = props.id || (typeof children === 'string' ? slugify(children) : undefined);
    return <h5 id={id} className="text-base font-medium my-3 scroll-mt-28" {...props}>{children}</h5>;
  },
  p: (props: React.ComponentPropsWithoutRef<'p'>) => (
    <p className="my-3" {...props} />
  ),
  a: (props: React.ComponentPropsWithoutRef<'a'>) => (
    <a
      className="text-blue-600 dark:text-blue-400 hover:underline no-underline"
      {...props}
    />
  ),
  ul: (props: React.ComponentPropsWithoutRef<'ul'>) => (
    <ul className="list-disc pl-5 my-4" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<'ol'>) => (
    <ol className="list-decimal pl-5 my-4" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<'li'>) => <li className="mb-2" {...props} />,
  code: (props: React.ComponentPropsWithoutRef<'code'>) => (
    <code
      className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1 py-0.5 rounded text-sm font-mono"
      {...props}
    />
  ),
  pre: (props: React.ComponentPropsWithoutRef<'pre'>) => (
    <pre
      className="rounded-lg p-4 my-6 bg-gray-100 dark:bg-gray-800 overflow-x-auto border border-gray-200 dark:border-gray-700"
      {...props}
    />
  ),
  strong: (props: React.ComponentPropsWithoutRef<'strong'>) => (
    <strong {...props} />
  ),
  em: (props: React.ComponentPropsWithoutRef<'em'>) => <em {...props} />,
  blockquote: (props: React.ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      className="border-l-4 border-gray-200 dark:border-gray-700 pl-4 my-4 italic"
      {...props}
    />
  ),
  table: (props: React.ComponentPropsWithoutRef<'table'>) => (
    <table className="min-w-full divide-y divide-gray-200 my-6" {...props} />
  ),
  th: (props: React.ComponentPropsWithoutRef<'th'>) => (
    <th
      className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-left text-sm font-medium"
      {...props}
    />
  ),
  td: (props: React.ComponentPropsWithoutRef<'td'>) => (
    <td className="px-4 py-2 border-t border-gray-200 dark:border-gray-700" {...props} />
  ),
  hr: (props: React.ComponentPropsWithoutRef<'hr'>) => (
    <hr className="my-6 border-gray-200 dark:border-gray-700" {...props} />
  ),
};

interface MDXProviderWrapperProps {
  children: React.ReactNode;
  useFunMode?: boolean;
}

export function MDXProviderWrapper({ children, useFunMode = false }: MDXProviderWrapperProps) {
  return (
    <div className={cn(useFunMode ? 'fun-mode' : '')}>
      <MDXProvider components={components}>{children}</MDXProvider>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          /* Font styles based on mode */
          .mdx-content:not(.fun-mode) {
            font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
            font-size: 1.0rem !important;
          }
          
          .mdx-content:not(.fun-mode) *:not(pre, code) {
            font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          }
          
          /* Fun mode (handwriting) styles - apply to everything including code blocks */
          .mdx-content.fun-mode,
          .mdx-content.fun-mode *,
          .mdx-content.fun-mode code,
          .mdx-content.fun-mode pre,
          .mdx-content.fun-mode .shiki,
          .mdx-content.fun-mode .shiki code,
          .mdx-content.fun-mode .shiki .line {
            font-family: 'Williams Handwriting', cursive !important;
            font-size: 1.2rem !important;
          }
          
          /* Force monospace for code elements regardless of site font setting */
          .mdx-content code, 
          .mdx-content pre, 
          .mdx-content .shiki, 
          .mdx-content .shiki code {
            font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
            font-size: 0.9rem !important; /* Keep code blocks slightly smaller */
          }
          
          /* Additional list styling */
          .mdx-content ul li:last-child,
          .mdx-content ol li:last-child {
            margin-bottom: 0 !important;
          }
          
          /* Code block styling */
          .mdx-content pre {
            margin: 1.5rem 0 !important;
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
