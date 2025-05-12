export interface TypeInfo {
  kind: "simple" | "generic" | "union" | "optional" | "callable" | "tuple";
  type_str: string;
  description?: string;
  // For generic types
  base_type?: TypeInfo;
  parameters?: TypeInfo[];
}

export interface TypeLinkProps {
  type: TypeInfo;
}

/**
 * TypeLink component that displays type information from a structured TypeInfo object.
 * Currently just renders the type string, but will be enhanced with linking in the future.
 */
export function TypeLink({ type }: TypeLinkProps) {
  if (!type) {
    return <span className="font-mono">-</span>;
  }

  return <span className="font-mono">{type.type_str}</span>;
}
