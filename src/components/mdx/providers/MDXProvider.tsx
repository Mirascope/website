import React from "react";
import { MDXProvider as BaseMDXProvider } from "@mdx-js/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Link as LinkIcon } from "lucide-react";
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
  Icon,
} from "@/src/components/mdx/elements";
import {
  ApiType,
  ApiSignature,
  ParametersTable,
  ReturnTable,
  AttributesTable,
  TypeLink,
} from "@/src/components/docs/api";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { ButtonLink } from "@/src/components/ui/button-link";
import { ProductLogo, MirascopeLogo, LilypadLogo } from "@/src/components/core/branding";
import { ProviderCodeWrapper } from "./ProviderCodeWrapper";
import { ResponsiveImage } from "@/src/components/mdx/providers/ResponsiveImage";
import { devComponents } from "@/src/components/mdx/elements/DevComponents";
import { slugify } from "@/src/lib/utils";

// MDX-specific ButtonLink wrapper that bypasses type checking at the MDX boundary
// and handles nested paragraph tags that MDX generates
const MDXButtonLink = (props: React.ComponentProps<typeof ButtonLink>) => {
  // Extract children from paragraph tags that MDX might add
  return (
    <ButtonLink {...props}>
      {React.Children.map(props.children, (child) => {
        // If it's a paragraph element, extract its children
        if (
          React.isValidElement(child) &&
          (child.type === "p" || (typeof child.type === "function" && child.type.name === "p"))
        ) {
          // Type assertion to access props safely
          const elementProps = (child as React.ReactElement<{ children?: React.ReactNode }>).props;
          return elementProps.children;
        }
        return child;
      })}
    </ButtonLink>
  );
};

// Heading anchor link component
const HeadingAnchor = ({ id }: { id?: string }) => {
  const navigate = useNavigate();

  if (!id) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Prevent default browser behavior
    e.preventDefault();

    // Use TanStack Router's navigate to update the hash
    // This leverages the router's built-in scroll restoration
    navigate({
      hash: id,
      // Use replace to avoid adding to history stack
      replace: true,
    });
  };

  return (
    <a
      href={`#${id}`}
      onClick={handleClick}
      aria-label="Link to this heading"
      className="heading-anchor text-muted-foreground hover:text-primary ml-2 opacity-0 transition-opacity group-hover:opacity-100"
    >
      <LinkIcon size={16} />
    </a>
  );
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
  Icon,

  // API documentation components
  ApiType,
  ApiSignature,
  AttributesTable,
  ParametersTable,
  ReturnTable,
  TypeLink,

  // UI Components
  Button,
  ButtonLink: MDXButtonLink, // Use the MDX-specific wrapper for ButtonLink
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ProductLogo,
  MirascopeLogo,
  LilypadLogo,

  // Dev components
  ...devComponents,

  // Shorthand components
  Install: InstallSnippet,

  // Standard HTML elements
  h1: ({ children, ...props }: React.ComponentPropsWithoutRef<"h1">) => {
    // Generate an ID from the text content if not provided
    const id = props.id || (typeof children === "string" ? slugify(children) : undefined);
    return (
      <h1
        id={id}
        className="group my-6 flex scroll-mt-[120px] items-center text-3xl font-bold first:mt-0"
        {...props}
      >
        {children}
        <HeadingAnchor id={id} />
      </h1>
    );
  },
  h2: ({ children, ...props }: React.ComponentPropsWithoutRef<"h2">) => {
    const id = props.id || (typeof children === "string" ? slugify(children) : undefined);
    return (
      <h2
        id={id}
        className="group my-5 flex scroll-mt-[120px] items-center text-2xl font-semibold"
        {...props}
      >
        {children}
        <HeadingAnchor id={id} />
      </h2>
    );
  },
  h3: ({ children, ...props }: React.ComponentPropsWithoutRef<"h3">) => {
    const id = props.id || (typeof children === "string" ? slugify(children) : undefined);
    return (
      <h3
        id={id}
        className="group my-4 flex scroll-mt-[120px] items-center text-xl font-medium"
        {...props}
      >
        {children}
        <HeadingAnchor id={id} />
      </h3>
    );
  },
  h4: ({ children, ...props }: React.ComponentPropsWithoutRef<"h4">) => {
    const id = props.id || (typeof children === "string" ? slugify(children) : undefined);
    return (
      <h4
        id={id}
        className="group my-3 flex scroll-mt-[120px] items-center text-lg font-medium"
        {...props}
      >
        {children}
        <HeadingAnchor id={id} />
      </h4>
    );
  },
  h5: ({ children, ...props }: React.ComponentPropsWithoutRef<"h5">) => {
    const id = props.id || (typeof children === "string" ? slugify(children) : undefined);
    return (
      <h5
        id={id}
        className="group my-3 flex scroll-mt-[120px] items-center text-base font-medium"
        {...props}
      >
        {children}
        <HeadingAnchor id={id} />
      </h5>
    );
  },
  p: (props: React.ComponentPropsWithoutRef<"p">) => <p className="my-3 text-base" {...props} />,
  a: (props: React.ComponentPropsWithoutRef<"a">) => {
    // Check if the link is internal
    const { href, ...rest } = props;
    if (
      href &&
      (href.startsWith("/") ||
        (href !== "#" &&
          !href.startsWith("http") &&
          !href.startsWith("https") &&
          !href.startsWith("mailto:") &&
          !href.startsWith("tel:")))
    ) {
      // It's an internal link, use Link from TanStack Router
      return (
        <Link to={href} className="text-primary text-base no-underline hover:underline" {...rest} />
      );
    }

    // Use regular <a> for external links or anchor links
    return <a className="text-primary text-base no-underline hover:underline" {...props} />;
  },
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="my-4 list-disc pl-5" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="my-4 list-decimal pl-5" {...props} />
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
        className="bg-muted text-muted-foreground rounded px-1 py-0.5 font-mono text-[0.9em]"
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
        className="bg-muted border-border my-6 overflow-x-auto rounded-lg border p-4"
        {...props}
      />
    );
  },
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => <strong {...props} />,
  em: (props: React.ComponentPropsWithoutRef<"em">) => <em {...props} />,
  blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="border-border my-4 border-l-4 pl-4 italic" {...props} />
  ),
  table: (props: React.ComponentPropsWithoutRef<"table">) => (
    <div className="table-container">
      <table className="divide-border my-6 min-w-full divide-y" {...props} />
    </div>
  ),
  th: (props: React.ComponentPropsWithoutRef<"th">) => (
    <th
      className="bg-card text-card-foreground px-4 py-2 text-left text-sm font-medium"
      {...props}
    />
  ),
  td: (props: React.ComponentPropsWithoutRef<"td">) => (
    <td className="border-border border-t px-4 py-2" {...props} />
  ),
  hr: (props: React.ComponentPropsWithoutRef<"hr">) => (
    <hr className="border-border my-6" {...props} />
  ),
};

interface MDXProviderProps {
  children: React.ReactNode;
  components: Record<string, React.ComponentType<any>>;
}

// Export the MDXProvider directly
export function MDXProvider({ children, components }: MDXProviderProps) {
  return <BaseMDXProvider components={components}>{children}</BaseMDXProvider>;
}
