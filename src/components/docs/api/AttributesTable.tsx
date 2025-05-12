import { TypeLink } from "./TypeLink";

export type Attribute = {
  name: string;
  type?: string;
  description?: string;
  module_context?: string;
  is_builtin?: boolean;
};

interface AttributesTableProps {
  attributes: Attribute[];
  contentSubpath?: string;
  currentModule?: string;
}

/**
 * Component to display a table of class attributes with linked type references
 */
export function AttributesTable({
  attributes,
  contentSubpath = "docs/mirascope",
  currentModule,
}: AttributesTableProps) {
  if (!attributes || attributes.length === 0) {
    return null;
  }

  return (
    <div className="api-attributes my-6">
      <h3 className="mb-2 text-lg font-semibold">Attributes</h3>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse">
          <thead className="bg-muted">
            <tr>
              <th className="border-b px-4 py-2 text-left">Name</th>
              <th className="border-b px-4 py-2 text-left">Type</th>
              <th className="border-b px-4 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {attributes.map((attr, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                <td className="border-b px-4 py-2 font-mono">{attr.name}</td>
                <td className="text-primary border-b px-4 py-2">
                  <TypeLink
                    type={attr.type || "-"}
                    moduleContext={attr.module_context}
                    isBuiltin={attr.is_builtin}
                    contentSubpath={contentSubpath}
                    currentModule={currentModule}
                  />
                </td>
                <td className="border-b px-4 py-2">{attr.description || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
