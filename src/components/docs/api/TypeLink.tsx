export interface TypeLinkProps {
  type: string;
}

/**
 * Simplified TypeLink component that just displays the type as text.
 * This is a first-pass simplification that removes all linking logic.
 * Future implementations will restore linking capabilities in a more
 * structured way based on the new type model.
 */
export function TypeLink({ type }: TypeLinkProps) {
  if (!type) {
    return <span className="font-mono">-</span>;
  }

  return <span className="font-mono">{type}</span>;
}
