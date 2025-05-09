"""Type handling utilities for API documentation generation.

This module provides structured representations and utilities for handling
Python type annotations within the API documentation system.
"""

from dataclasses import dataclass

from griffe import Alias, Function, Module, Object

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


@dataclass
class TypeInfo:
    """Structured information about a type annotation."""

    type_str: str
    module_context: str
    is_builtin: bool
    description: str | None = None


@dataclass
class ParameterInfo:
    """Structured information about a function/method parameter."""

    name: str
    type_info: TypeInfo | None = None
    default: str | None = None
    description: str | None = None


@dataclass
class ReturnInfo:
    """Structured information about a function/method return value."""

    type_info: TypeInfo
    description: str | None = None


def get_type_origin(annotation, module: Module) -> TypeInfo:
    """Find the origin module of a type annotation.

    Args:
        annotation: The type annotation to analyze
        module: The module that contains the type annotation

    Returns:
        TypeInfo object with information about the type origin

    """
    # Start with default values
    is_internal = True
    module_path = module.path

    # Extract the base type name (without generic parameters or union pipes)
    type_str = str(annotation)
    base_type = type_str.split("[")[0].split("|")[0].strip()

    # Check if it's a fully qualified name (contains dots)
    if "." in base_type:
        parts = base_type.split(".")
        module_path = ".".join(parts[:-1])
        is_internal = True
        return TypeInfo(
            type_str=type_str, module_context=module_path, is_builtin=not is_internal
        )

    # For types that don't have dots, check if they're imported
    if hasattr(module, "members"):
        # Look through imported names in this module
        for member_name, member in module.members.items():
            if isinstance(member, Alias) and member_name == base_type:
                # Found an import of this name
                if hasattr(member, "target"):
                    # Handle cases where the target might be None or from an external package
                    # like Pydantic that we can't fully resolve
                    if member.target:
                        target_path = getattr(member.target, "path", "")
                        if target_path:
                            # This extracts the module path from the target path
                            module_path = ".".join(target_path.split(".")[:-1])
                            return TypeInfo(
                                type_str=type_str,
                                module_context=module_path,
                                is_builtin=not is_internal,
                            )
                    else:
                        # For external packages like Pydantic, we can infer from the module name
                        # or use the current module context
                        module_path = module.path
                        is_internal = False
                        return TypeInfo(
                            type_str=type_str,
                            module_context=module_path,
                            is_builtin=not is_internal,
                        )

    if base_type in PYTHON_BUILTINS:
        module_path = (
            "builtins"
            if base_type
            in {"str", "int", "float", "bool", "list", "dict", "tuple", "set"}
            else "typing"
        )
        is_internal = False

    return TypeInfo(
        type_str=type_str, module_context=module_path, is_builtin=not is_internal
    )


def extract_params_if_available(
    obj: Object | Alias, module: Module | None = None
) -> list[ParameterInfo]:
    """Extract parameter information from a Griffe object.

    Args:
        obj: The Griffe object to extract parameters from
        module: Optional module context if not available from obj

    Returns:
        A list of ParameterInfo objects

    """
    # Get the containing module for context
    if not module:
        module = getattr(obj, "module", None)

    # First try with direct parameters (most reliable)
    if isinstance(obj, Function) and obj.parameters:
        params_data = []
        for param in obj.parameters:
            param_data = ParameterInfo(name=param.name)

            # Add type annotation if available
            if param.annotation and module:
                type_info = get_type_origin(param.annotation, module)
                param_data.type_info = type_info

            # Add default value if available
            if param.default:
                param_data.default = str(param.default)

            params_data.append(param_data)
        return params_data

    # Try from docstring if parameters aren't available
    if hasattr(obj, "docstring") and obj.docstring and hasattr(obj.docstring, "parsed"):
        params_data = []
        for section in obj.docstring.parsed:
            if section.kind == "parameters" and hasattr(section, "value"):
                for param in section.value:
                    if hasattr(param, "name"):
                        param_data = ParameterInfo(name=param.name)

                        # Add type annotation if available
                        if hasattr(param, "annotation") and param.annotation and module:
                            type_info = get_type_origin(param.annotation, module)
                            param_data.type_info = type_info

                        # Add description if available
                        if hasattr(param, "description") and param.description:
                            param_data.description = str(param.description)

                        # Add default value if available
                        if hasattr(param, "default") and param.default:
                            param_data.default = str(param.default)

                        params_data.append(param_data)

        if params_data:
            return params_data

    # Return empty list if no parameters found
    return []    

def extract_return_info(
    obj: Object | Alias
) -> ReturnInfo | None:
    """Extract return type information from a Griffe object.

    Args:
        obj: The Griffe object to extract return info from
        module: Optional module context if not available from obj

    Returns:
        ReturnInfo object if available, None otherwise

    """
    # Get the containing module for context
    module = obj.module
    print(module)

    type_str = None
    description = None

    # Handle aliases - set a default type for aliases (decorators)
    if isinstance(obj, Alias):
        type_str = "Callable"

        # Check if alias's target has annotation
        if hasattr(obj, "target"):
            annotation = getattr(obj.target, "annotation", None)
            if annotation:
                type_str = str(annotation)

                # Create TypeInfo
                if module:
                    type_info = get_type_origin(annotation, module)
                    if description:
                        return ReturnInfo(type_info=type_info, description=description)
                    return ReturnInfo(type_info=type_info)

    # Get type from function's return annotation (most reliable)
    elif isinstance(obj, Function) and hasattr(obj, "returns") and obj.returns:
        type_str = str(obj.returns)

        # Create TypeInfo
        if module:
            type_info = get_type_origin(obj.returns, module)
            if description:
                return ReturnInfo(type_info=type_info, description=description)
            return ReturnInfo(type_info=type_info)

    # Try to get description from docstring's parsed sections
    if hasattr(obj, "docstring") and obj.docstring:
        if hasattr(obj.docstring, "parsed"):
            for section in obj.docstring.parsed:
                if section.kind == "returns" and hasattr(section, "value"):
                    # Add type from docstring if not already specified
                    if not type_str:
                        # Check if section has an annotation attribute directly
                        annotation = getattr(section, "annotation", None)
                        if annotation:
                            type_str = str(annotation)

                            # Create TypeInfo if module is available
                            if module:
                                type_info = get_type_origin(annotation, module)

                        # Or check if section has a value with annotation
                        elif hasattr(section, "value"):
                            value_annotation = (
                                getattr(section.value, "annotation", None)
                                if not isinstance(section.value, (list, str))
                                else None
                            )
                            if value_annotation:
                                type_str = str(value_annotation)

                                # Create TypeInfo if module is available
                                if module:
                                    type_info = get_type_origin(
                                        value_annotation, module
                                    )

                    # Add description if available
                    if hasattr(section, "value"):
                        if not isinstance(section.value, (list, str)):
                            description = getattr(section.value, "description", None)
                            if description:
                                description = str(description)
                                break  # Found what we need
                        elif isinstance(section.value, str):
                            description = str(section.value)
                            break  # Found what we need
                        elif isinstance(section.value, list) and len(section.value) > 0:
                            # Handle list of DocstringReturn objects
                            description = getattr(section.value[0], "description", None)
                            if description:
                                description = str(description)
                            break

    # If we have the necessary information, create and return ReturnInfo
    if type_str:
        # Create default TypeInfo if not created yet
        if module:
            type_info = get_type_origin(type_str, module)
            return ReturnInfo(type_info=type_info, description=description)


def parameter_info_to_dict(param: ParameterInfo) -> dict[str, str]:
    """Convert a ParameterInfo object to a dictionary for component formatting.

    Args:
        param: The ParameterInfo object to convert
    Returns:
        A dictionary representing the parameter

    """
    result = {"name": param.name}
    if param.type_info:
        result["type"] = param.type_info.type_str
        result["module_context"] = param.type_info.module_context
        result["is_builtin"] = str(param.type_info.is_builtin).lower()
    if param.default:
        result["default"] = param.default
    if param.description:
        result["description"] = param.description
    return result


def parameters_to_dict_list(params: list[ParameterInfo]) -> list[dict[str, str]]:
    """Convert a list of ParameterInfo objects to a list of dictionaries.

    Args:
        params: The list of ParameterInfo objects to convert
    Returns:
        A list of dictionaries representing the parameters

    """
    return [parameter_info_to_dict(param) for param in params]


def return_info_to_dict(return_info: ReturnInfo) -> dict[str, str]:
    """Convert a ReturnInfo object to a dictionary for component formatting.

    Args:
        return_info: The ReturnInfo object to convert
    Returns:
        A dictionary representing the return info

    """
    result = {
        "type": return_info.type_info.type_str,
        "module_context": return_info.type_info.module_context,
        "is_builtin": str(return_info.type_info.is_builtin).lower(),
    }
    if return_info.description:
        result["description"] = return_info.description
    return result
