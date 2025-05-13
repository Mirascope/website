/**
 * Component to display the API object type within headings
 *
 * Renders the type as a colored label and stores metadata for documentation linking.
 */
export interface ApiTypeProps {
  /** The type of API object (Module, Class, Function, Alias, Attribute) */
  type: string;
  /** The path to the document (e.g., "core/anthropic/call_params") */
  path: string;
  /** The name of the symbol (e.g., "AnthropicCallParams") */
  symbolName: string;
}

export function ApiType({ type, path, symbolName }: ApiTypeProps) {
  return (
    <span
      className="text-card-foreground bg-card mr-2 rounded-md px-2 py-1 align-middle text-sm font-medium"
      data-path={path}
      data-symbol={symbolName}
    >
      {type}
    </span>
  );
}
