import { MDXProviderWrapper, components } from "./MDXProvider";
import { MDXRemote } from "next-mdx-remote";
import { LoadingContent } from "@/src/components/docs";

interface MDXRendererProps {
  code: string;
  frontmatter: Record<string, any>;
}

// Define interface for what MDXRemote expects - must match MDXRemoteSerializeResult
interface MDXRemoteProps {
  compiledSource: string;
  scope: Record<string, any>;
  frontmatter: Record<string, any>; // Making this required as well
  components?: Record<string, React.ComponentType<any>>;
  [key: string]: any;
}

/**
 * MDXRenderer - Renders MDX content using @mdx-js/react
 */
export function MDXRenderer({ code, frontmatter }: MDXRendererProps) {
  // Handle case when no code is provided
  if (!code) {
    return <LoadingContent spinnerClassName="h-8 w-8" fullHeight={false} />;
  }

  // Use next-mdx-remote for rendering
  try {
    // Create a compatible MDXRemote input that satisfies the type requirements
    const mdxProps: MDXRemoteProps = {
      compiledSource: code,
      frontmatter: frontmatter,
      scope: frontmatter,
      components: components as any,
    };

    return (
      <div className="mdx-content prose max-w-none">
        <MDXProviderWrapper>
          <MDXRemote {...mdxProps} />
        </MDXProviderWrapper>
      </div>
    );
  } catch (error) {
    console.error("Error rendering MDX with next-mdx-remote:", error);
    return (
      <div className="p-4 border border-red-500 rounded-md bg-red-50 text-red-800">
        <h3 className="font-bold mb-2">Error rendering MDX</h3>
        <p>{error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
}
