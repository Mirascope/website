"""Type modeling and parsing for API documentation generation.

This module provides a structured type model for Python type annotations,
offering a more comprehensive representation than simple strings.
"""

from dataclasses import dataclass, field


@dataclass
class BaseTypeInfo:
    """Base class for all type info representations."""

    type_str: str  # Original string representation
    module_context: str  # Module containing this type
    is_builtin: bool  # Whether this is a Python builtin
    description: str | None = None  # Optional description
    # Making kind a required argument but with a default that gets overridden in subclasses
    kind: str = ""


@dataclass
class SimpleType(BaseTypeInfo):
    """Represents a simple type like 'str', 'int', or custom class."""

    # Use field with default_factory to ensure kind is always "simple"
    kind: str = field(default="simple")


# Define the TypeInfo union type
TypeInfo = SimpleType  # Will expand to include other types


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


def parse_type_string(type_str: str, module_context: str) -> TypeInfo:
    """Parse a type string into a TypeInfo object.

    Currently only supports simple types.

    Args:
        type_str: The type string to parse
        module_context: The module context for the type

    Returns:
        A TypeInfo object representing the parsed type

    """
    # For now, just handle simple types
    return SimpleType(
        type_str=type_str,
        module_context=module_context,
        is_builtin=type_str in PYTHON_BUILTINS,
    )
