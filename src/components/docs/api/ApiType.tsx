/**
 * Component to display the API object type within headings
 *
 * Renders the type as a colored label and stores metadata for documentation linking.
 */
export interface ApiTypeProps {
  /** The type of API object (Module, Class, Function, Alias) */
  type: string;
  /** The full module path (e.g., "mirascope.core.anthropic.call_params") */
  module: string;
  /** The path to the document (e.g., "core/anthropic/call_params") */
  path: string;
  /** The name of the symbol (e.g., "AnthropicCallParams") */
  symbolName: string;
}

export function ApiType({ type, module, path, symbolName }: ApiTypeProps) {
  return (
    <span
      className="text-card-foreground bg-card mr-2 rounded-md px-2 py-1 align-middle text-sm font-medium"
      data-module={module}
      data-path={path}
      data-symbol={symbolName}
    >
      {type}
    </span>
  );
}
