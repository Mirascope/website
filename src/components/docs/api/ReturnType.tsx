export type ReturnTypeProps = {
  type: string;
  description?: string;
};

/**
 * Component to display a function return type
 */
export function ReturnType({ type, description }: ReturnTypeProps) {
  if (!type) {
    return null;
  }

  return (
    <div className="api-return-type my-6">
      <h3 className="mb-2 text-lg font-semibold">Returns</h3>
      <div className="rounded-md border p-3">
        <div className="text-primary font-mono">{type}</div>
        {description && <div className="mt-2">{description}</div>}
      </div>
    </div>
  );
}
