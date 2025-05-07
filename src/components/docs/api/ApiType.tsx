/**
 * Component to display the API object type
 */
export function ApiType({ type }: { type: string }) {
  return (
    <div className="api-type mb-4">
      <span className="text-foreground font-semibold">Type:</span> {type}
    </div>
  );
}
