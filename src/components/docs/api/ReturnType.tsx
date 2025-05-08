import { TypeLink } from "./TypeLink";

export type ReturnTypeProps = {
  type: string;
  description?: string;
  moduleContext?: string;
  isBuiltin?: boolean;
  contentSubpath?: string;
  currentModule?: string;
};

/**
 * Component to display a function return type with linked references
 */
export function ReturnType({
  type,
  description,
  moduleContext,
  isBuiltin = false,
  contentSubpath = "docs/mirascope",
  currentModule,
}: ReturnTypeProps) {
  if (!type) {
    return null;
  }

  return (
    <div className="api-return-type my-6">
      <h3 className="mb-2 text-lg font-semibold">Returns</h3>
      <div className="rounded-md border p-3">
        <div className="text-primary">
          <TypeLink
            type={type}
            moduleContext={moduleContext}
            isBuiltin={isBuiltin}
            contentSubpath={contentSubpath}
            currentModule={currentModule}
          />
        </div>
        {description && <div className="mt-2">{description}</div>}
      </div>
    </div>
  );
}
