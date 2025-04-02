import React from 'react';
import { MDXProviderWrapper, components } from './MDXProvider';
import { MDXRemote } from 'next-mdx-remote';

interface MDXRendererProps {
  code: string;
  frontmatter: Record<string, any>;
  useFunMode?: boolean;
}

/**
 * MDXRenderer - Renders MDX content using @mdx-js/react
 */
export function MDXRenderer({ code, frontmatter, useFunMode = false }: MDXRendererProps) {
  // Handle case when no code is provided
  if (!code) {
    return <div className="animate-pulse bg-gray-100 h-40 rounded-md"></div>;
  }

  // Use next-mdx-remote for rendering
  try {
    // Assuming code is the compiled MDX content in the format next-mdx-remote expects
    return (
      <div className={`mdx-content prose max-w-none ${useFunMode ? 'fun-mode' : ''}`}>
        <MDXProviderWrapper useFunMode={useFunMode}>
          <MDXRemote 
            compiledSource={code} 
            scope={frontmatter}
            // This ensures our custom components in MDXProvider are used
            components={components}
          />
        </MDXProviderWrapper>
      </div>
    );
  } catch (error) {
    console.error('Error rendering MDX with next-mdx-remote:', error);
    return (
      <div className="p-4 border border-red-500 rounded-md bg-red-50 text-red-800">
        <h3 className="font-bold mb-2">Error rendering MDX</h3>
        <p>{error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
}
