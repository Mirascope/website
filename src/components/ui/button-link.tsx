import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import { buttonVariants } from "./button";
import { cn } from "@/src/lib/utils";
import type { ButtonProps } from "./button";

export interface ButtonLinkProps {
  href: string;
  external?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  children?: React.ReactNode;
}

/**
 * ButtonLink component that renders either a Link or an anchor tag with button styling
 * based on whether the link is internal or external.
 */
export function ButtonLink({
  className,
  variant = "outline",
  size = "default",
  href,
  external,
  children,
  ...props
}: ButtonLinkProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonLinkProps>) {
  // Determine if link is external based on explicit prop or href format
  const isExternal =
    external || href.startsWith("http") || href.startsWith("https") || href.startsWith("//");

  // Use button styling
  const classNames = cn(buttonVariants({ variant, size, className }));

  if (isExternal) {
    return (
      <a href={href} className={classNames} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }

  // For internal links, we use Tanstack Router's Link component
  // This version expects proper route typing
  return (
    <Link
      to={href as LinkProps["to"]}
      className={classNames}
      {...(props as Omit<LinkProps, "to" | "className">)}
    >
      {children}
    </Link>
  );
}
