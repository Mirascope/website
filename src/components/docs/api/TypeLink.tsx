import React from "react";
import { Link } from "@tanstack/react-router";

// Common Python built-in types and their documentation URLs
const PYTHON_BUILTIN_TYPES: Record<string, string> = {
  str: "https://docs.python.org/3/library/stdtypes.html#str",
  int: "https://docs.python.org/3/library/functions.html#int",
  float: "https://docs.python.org/3/library/functions.html#float",
  bool: "https://docs.python.org/3/library/functions.html#bool",
  list: "https://docs.python.org/3/library/stdtypes.html#list",
  dict: "https://docs.python.org/3/library/stdtypes.html#dict",
  tuple: "https://docs.python.org/3/library/stdtypes.html#tuple",
  set: "https://docs.python.org/3/library/stdtypes.html#set",
  None: "https://docs.python.org/3/library/constants.html#None",
  Callable: "https://docs.python.org/3/library/typing.html#typing.Callable",
  Optional: "https://docs.python.org/3/library/typing.html#typing.Optional",
  Union: "https://docs.python.org/3/library/typing.html#typing.Union",
  Any: "https://docs.python.org/3/library/typing.html#typing.Any",
  List: "https://docs.python.org/3/library/typing.html#typing.List",
  Dict: "https://docs.python.org/3/library/typing.html#typing.Dict",
  Tuple: "https://docs.python.org/3/library/typing.html#typing.Tuple",
  Set: "https://docs.python.org/3/library/typing.html#typing.Set",
  Type: "https://docs.python.org/3/library/typing.html#typing.Type",
  Generator: "https://docs.python.org/3/library/typing.html#typing.Generator",
  Iterable: "https://docs.python.org/3/library/typing.html#typing.Iterable",
  Iterator: "https://docs.python.org/3/library/typing.html#typing.Iterator",
  Sequence: "https://docs.python.org/3/library/typing.html#typing.Sequence",
  Mapping: "https://docs.python.org/3/library/typing.html#typing.Mapping",
  object: "https://docs.python.org/3/library/functions.html#object",
  BaseModel: "https://docs.pydantic.dev/latest/api/base_model/",
};

// We'll use this in the future for linking to Python standard library modules
// when they're referenced in type expressions
/* 
const PYTHON_STDLIB_MODULES: Record<string, string> = {
  pathlib: "https://docs.python.org/3/library/pathlib.html",
  collections: "https://docs.python.org/3/library/collections.html",
  typing: "https://docs.python.org/3/library/typing.html",
  re: "https://docs.python.org/3/library/re.html",
  json: "https://docs.python.org/3/library/json.html",
  datetime: "https://docs.python.org/3/library/datetime.html",
  os: "https://docs.python.org/3/library/os.html",
  sys: "https://docs.python.org/3/library/sys.html",
};
*/

// Regex patterns for parsing complex type expressions
// Used for detecting simple type names vs complex expressions
// Currently using explicit pattern matching in the code instead
// const SIMPLE_TYPE_PATTERN = /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$/;
const GENERIC_TYPE_PATTERN = /^([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)\[(.*)\]$/;
const UNION_TYPE_PATTERN = /^(?:Union\[)?(.+?)(?:\s*\|\s*|\s*,\s*)(.+)(?:\])?$/;
const CALLABLE_TYPE_PATTERN = /^Callable\[\[(.+)\],\s*(.+)\]$/;

/**
 * Generate an API documentation link for the given type name.
 * Handles fully qualified names and relative imports based on context.
 */
function getApiLink(
  typeName: string,
  moduleContext?: string,
  contentSubpath = "docs/mirascope",
  currentModule?: string
): string | null {
  // Skip linking for Python built-ins
  if (PYTHON_BUILTIN_TYPES[typeName]) {
    return null;
  }

  // If it's already a fully qualified name (contains dots)
  if (typeName.includes(".")) {
    const parts = typeName.split(".");
    const packageName = parts[0];

    // Only handle known packages
    if (packageName === "mirascope") {
      const restPath = parts.slice(1).join("/");
      return `/${contentSubpath}/api/${restPath}`;
    }
    return null;
  }

  // For unqualified names, try to resolve them using module context
  if (moduleContext && moduleContext.startsWith("mirascope")) {
    // Convert module path to URL path
    const modulePath = moduleContext.split(".");

    // Handle same-module references by appending the type name to current module
    if (currentModule && moduleContext === currentModule) {
      return `/${contentSubpath}/api/${modulePath.slice(1).join("/")}/${typeName}`;
    }

    // Otherwise link to the module that defines/imports the type
    return `/${contentSubpath}/api/${modulePath.slice(1).join("/")}/${typeName}`;
  }

  return null;
}

/**
 * Process a single type name, generating a link if appropriate
 */
function processSingleType(
  typeName: string,
  moduleContext?: string,
  contentSubpath = "docs/mirascope",
  currentModule?: string
): React.ReactNode {
  // Handle built-in Python types
  if (PYTHON_BUILTIN_TYPES[typeName]) {
    return (
      <a
        href={PYTHON_BUILTIN_TYPES[typeName]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {typeName}
      </a>
    );
  }

  // Try to generate an API link
  const apiLink = getApiLink(typeName, moduleContext, contentSubpath, currentModule);

  if (apiLink) {
    return (
      <Link to={apiLink} className="text-primary hover:underline">
        {typeName}
      </Link>
    );
  }

  // Return plain text for types that can't be linked
  return typeName;
}

/**
 * Parse a complex type expression and generate linked components
 */
function parseTypeExpression(
  typeExpression: string,
  moduleContext?: string,
  contentSubpath = "docs/mirascope",
  currentModule?: string
): React.ReactNode {
  if (!typeExpression) {
    return null;
  }

  // Callable[[Args], ReturnType]
  const callableMatch = typeExpression.match(CALLABLE_TYPE_PATTERN);
  if (callableMatch) {
    const [_, argsStr, returnTypeStr] = callableMatch;

    // Process argument types (could be multiple)
    const args = argsStr.split(",").map((arg) => arg.trim());
    const processedArgs = args.map((arg, index) => (
      <React.Fragment key={`arg-${index}`}>
        {index > 0 && ", "}
        {parseTypeExpression(arg, moduleContext, contentSubpath, currentModule)}
      </React.Fragment>
    ));

    // Process return type
    const processedReturnType = parseTypeExpression(
      returnTypeStr,
      moduleContext,
      contentSubpath,
      currentModule
    );

    return (
      <>
        {processSingleType("Callable", moduleContext, contentSubpath, currentModule)}
        [[{processedArgs}], {processedReturnType}]
      </>
    );
  }

  // Generic types like List[str] or Dict[str, Any]
  const genericMatch = typeExpression.match(GENERIC_TYPE_PATTERN);
  if (genericMatch) {
    const [_, baseType, parametersStr] = genericMatch;

    // Process the base type
    const processedBaseType = processSingleType(
      baseType,
      moduleContext,
      contentSubpath,
      currentModule
    );

    // Process the parameters - handle nested brackets
    let parameters: string[] = [];
    let currentParam = "";
    let depth = 0;

    for (let i = 0; i < parametersStr.length; i++) {
      const char = parametersStr[i];

      if (char === "[") {
        depth++;
        currentParam += char;
      } else if (char === "]") {
        depth--;
        currentParam += char;
      } else if (char === "," && depth === 0) {
        parameters.push(currentParam.trim());
        currentParam = "";
      } else {
        currentParam += char;
      }
    }

    if (currentParam.trim()) {
      parameters.push(currentParam.trim());
    }

    // Process each parameter
    const processedParams = parameters.map((param, index) => (
      <React.Fragment key={`param-${index}`}>
        {index > 0 && ", "}
        {parseTypeExpression(param, moduleContext, contentSubpath, currentModule)}
      </React.Fragment>
    ));

    return (
      <>
        {processedBaseType}[{processedParams}]
      </>
    );
  }

  // Union types (either Union[a, b] or a | b)
  const unionMatch = typeExpression.match(UNION_TYPE_PATTERN);
  if (unionMatch) {
    const [_, firstType, restTypes] = unionMatch;

    // Check if this is a Union[] syntax or | syntax
    if (typeExpression.startsWith("Union[")) {
      // Handle as Union[a, b]
      // Split properly by commas, respecting nested brackets
      let unionTypes: string[] = [];
      let currentType = firstType.trim();
      let depth = 0;

      for (let i = 0; i < restTypes.length; i++) {
        const char = restTypes[i];

        if (char === "[") {
          depth++;
          currentType += char;
        } else if (char === "]") {
          depth--;
          currentType += char;
        } else if (char === "," && depth === 0) {
          unionTypes.push(currentType.trim());
          currentType = "";
        } else {
          currentType += char;
        }
      }

      if (currentType.trim()) {
        unionTypes.push(currentType.trim());
      }

      // Add the first type from the regex match
      unionTypes.unshift(firstType.trim());

      // Process each union type
      const processedUnionTypes = unionTypes.map((type, index) => (
        <React.Fragment key={`union-${index}`}>
          {index > 0 && ", "}
          {parseTypeExpression(type, moduleContext, contentSubpath, currentModule)}
        </React.Fragment>
      ));

      return (
        <>
          {processSingleType("Union", moduleContext, contentSubpath, currentModule)}[
          {processedUnionTypes}]
        </>
      );
    } else {
      // Handle as a | b
      const processedFirstType = parseTypeExpression(
        firstType,
        moduleContext,
        contentSubpath,
        currentModule
      );
      const processedRestTypes = parseTypeExpression(
        restTypes,
        moduleContext,
        contentSubpath,
        currentModule
      );

      return (
        <>
          {processedFirstType} | {processedRestTypes}
        </>
      );
    }
  }

  // Handle Optional[Type]
  if (typeExpression.startsWith("Optional[") && typeExpression.endsWith("]")) {
    const innerType = typeExpression.slice(9, -1);
    return (
      <>
        {processSingleType("Optional", moduleContext, contentSubpath, currentModule)}[
        {parseTypeExpression(innerType, moduleContext, contentSubpath, currentModule)}]
      </>
    );
  }

  // For simple types, just use the single type processor
  return processSingleType(typeExpression, moduleContext, contentSubpath, currentModule);
}

export interface TypeLinkProps {
  type: string;
  moduleContext?: string;
  isBuiltin?: boolean;
  contentSubpath?: string;
  currentModule?: string;
}

/**
 * Component that renders a type expression with links to Python built-ins
 * and internal API references.
 */
export function TypeLink({
  type,
  moduleContext,
  // isBuiltin is not used directly but is passed from backend
  // to provide information about the type's origin
  isBuiltin: _isBuiltin = false,
  contentSubpath = "docs/mirascope",
  currentModule,
}: TypeLinkProps) {
  if (!type) {
    return <span className="font-mono">-</span>;
  }

  return (
    <span className="font-mono">
      {parseTypeExpression(type, moduleContext, contentSubpath, currentModule)}
    </span>
  );
}
