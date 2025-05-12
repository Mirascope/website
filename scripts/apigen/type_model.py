"""Type modeling and parsing for API documentation generation.

This module provides a structured type model for Python type annotations,
offering a more comprehensive representation than simple strings.
"""

import json
from dataclasses import asdict, dataclass, field


@dataclass
class BaseTypeInfo:
    """Base class for all type info representations."""

    type_str: str  # Original string representation
    module_context: str  # Module containing this type
    is_builtin: bool  # Whether this is a Python builtin
    description: str | None = None  # Optional description
    # Making kind a required argument but with a default that gets overridden in subclasses
    kind: str = ""

    def to_dict(self) -> dict:
        """Convert this object to a dictionary suitable for JSON serialization."""
        return asdict(self)

    def to_json(self) -> str:
        """Convert this object to a JSON string."""
        return json.dumps(self.to_dict())


@dataclass
class SimpleType(BaseTypeInfo):
    """Represents a simple type like 'str', 'int', or custom class."""

    # Use field with default_factory to ensure kind is always "simple"
    kind: str = field(default="simple")


@dataclass
class GenericType(BaseTypeInfo):
    """Represents a generic type like List[str] or Dict[str, int]."""

    # Use field with default to ensure kind is always "generic"
    kind: str = field(default="generic")
    # The base type (e.g., "List" in List[str])
    base_type: str = ""
    # Type parameters (can be any TypeInfo)
    parameters: list["TypeInfo"] = field(default_factory=list)


# Define the TypeInfo union type
TypeInfo = SimpleType | GenericType


# List of Python built-in types
PYTHON_BUILTINS = {
    "str",
    "int",
    "float",
    "bool",
    "list",
    "dict",
    "tuple",
    "set",
    "None",
    "Callable",
    "Optional",
    "Union",
    "Any",
    "List",
    "Dict",
    "Tuple",
    "Set",
    "Type",
    "Generator",
    "Iterable",
    "Iterator",
    "Sequence",
    "Mapping",
}


def split_parameters(params_str: str) -> list[str]:
    """Split a parameters string into individual parameter strings.

    Handles nested brackets correctly.

    Args:
        params_str: The parameters string to split

    Returns:
        A list of parameter strings

    """
    result = []
    current = ""
    depth = 0

    for char in params_str:
        if char == "[":
            depth += 1
            current += char
        elif char == "]":
            depth -= 1
            current += char
        elif char == "," and depth == 0:
            result.append(current.strip())
            current = ""
        else:
            current += char

    if current.strip():
        result.append(current.strip())

    return result


def parse_type_string(type_str: str, module_context: str) -> TypeInfo:
    """Parse a type string into a TypeInfo object.

    Supports simple types and generic types.

    Args:
        type_str: The type string to parse
        module_context: The module context for the type

    Returns:
        A TypeInfo object representing the parsed type

    """
    # Check if this is a generic type (contains square brackets)
    if "[" in type_str and type_str.endswith("]"):
        # Extract the base type and parameters
        open_bracket = type_str.find("[")
        base_type = type_str[:open_bracket]
        params_str = type_str[open_bracket + 1 : -1]

        # Parse parameters recursively
        parameters = []
        for param in split_parameters(params_str):
            param_type = parse_type_string(param, module_context)
            parameters.append(param_type)

        return GenericType(
            type_str=type_str,
            module_context=module_context,
            is_builtin=base_type in PYTHON_BUILTINS,
            base_type=base_type,
            parameters=parameters,
        )

    # Handle simple type if not generic
    return SimpleType(
        type_str=type_str,
        module_context=module_context,
        is_builtin=type_str in PYTHON_BUILTINS,
    )
