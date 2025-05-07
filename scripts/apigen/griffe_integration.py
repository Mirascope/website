"""Integration with Griffe for API documentation generation.

This module provides functionality to process API directives and generate
documentation using Griffe. The implementation focuses on generating clean,
accurate documentation with specialized handlers for different object types.
"""

import re
from collections.abc import Callable
from pathlib import Path

from griffe import (
    Alias,
    Class,
    Docstring,
    Extensions,
    Function,
    GriffeLoader,
    Module,
    Object,
    Parameters,
    Parser,
)

from scripts.apigen.doclinks import UpdateDocstringsExtension


def get_loader(
    source_repo_path: Path,
    content_dir: Path | None = None,
    content_subpath: str | None = None,
) -> GriffeLoader:
    """Create a configured Griffe loader.

    Args:
        source_repo_path: Path to the source repository
        content_dir: Path to the content directory for the doclinks extension
        content_subpath: Subpath (eg /docs/mirascope) for local link evaluation

    Returns:
        A configured GriffeLoader instance

    """
    # Set up the parser for Google-style docstrings
    parser = Parser("google")

    # Create loader with specified docstring parser
    loader = GriffeLoader(docstring_parser=parser)

    # Add the doclinks extension if content_dir is provided
    if content_dir and content_subpath:
        extensions = Extensions(UpdateDocstringsExtension(content_dir, content_subpath))
        loader.extensions = extensions

    return loader


def process_directive(directive: str, module: Module) -> str:
    """Process an API directive and generate documentation.

    Args:
        directive: The directive string (e.g., "::: mirascope.core.anthropic.call")
        module: The pre-loaded Griffe module

    Returns:
        The generated documentation content

    """
    # Extract the module/class/function name from the directive
    match = re.search(r"::: ([a-zA-Z0-9_.]+)(?:\s+(.+))?", directive)
    if not match:
        raise ValueError("Invalid directive format. Expected '::: module_name'.")

    object_path = match.group(1)

    # Split the path to navigate to the object
    path_parts = object_path.split(".")

    # Skip the top-level module name since we already have it loaded
    current_obj: Object | Alias = module

    # Navigate through the object path
    for i, part in enumerate(path_parts[1:], 1):
        if hasattr(current_obj, "members") and part in current_obj.members:
            current_obj = current_obj.members[part]
        else:
            raise ValueError(
                f"Could not find {'.'.join(path_parts[: i + 1])} in the module."
            )

    # Generate documentation based on object type
    object_type = current_obj.__class__.__name__

    # Type check and handlers
    handlers: dict[str, Callable[[Object | Alias], str]] = {
        "Function": document_placeholder,
        "Method": document_placeholder,
        "Class": document_placeholder,
        "Module": document_placeholder,
        "Alias": document_placeholder,
    }

    # Use the appropriate handler or a generic one if type not recognized
    handler = handlers.get(object_type, document_placeholder)
    return handler(current_obj)


def format_signature_from_parameters(name: str, parameters: Parameters) -> str:
    """Create a signature string from a Parameters object.

    Args:
        name: Function or method name
        parameters: Griffe Parameters object

    Returns:
        A formatted signature string

    """
    param_strs: list[str] = []

    # Parameters implements __iter__ which returns Parameter objects directly
    for param in parameters:
        param_str = param.name

        # Add type annotation if available
        if param.annotation:
            param_str += f": {param.annotation}"

        # Add default value if available
        if param.default:
            param_str += f" = {param.default}"

        param_strs.append(param_str)

    return f"{name}({', '.join(param_strs)})"


def format_signature_from_docstring(name: str, docstring: Docstring) -> str | None:
    """Create a signature string from a parsed docstring.

    Args:
        name: Function or method name
        docstring: Griffe Docstring object

    Returns:
        A formatted signature string, or None if no parameters found

    """
    param_strs: list[str] = []

    if not hasattr(docstring, "parsed"):
        return None

    for section in docstring.parsed:
        if section.kind == "parameters" and hasattr(section, "value"):
            for param in section.value:
                if hasattr(param, "name"):
                    param_str = param.name

                    # Add type annotation if available
                    if hasattr(param, "annotation") and param.annotation:
                        param_str += f": {param.annotation}"

                    # Add default value if available
                    if hasattr(param, "default") and param.default:
                        param_str += f" = {param.default}"

                    param_strs.append(param_str)

    if param_strs:
        return f"{name}({', '.join(param_strs)})"
    return None


def extract_params_if_available(obj: Object | Alias) -> list[dict]:
    """Extract parameter information from a Griffe object if available.

    This function tries multiple approaches to extract parameter information:
    1. First from the object's parameters attribute (for Function objects)
    2. Then from the object's parsed docstring

    Args:
        obj: The Griffe object to extract parameters from

    Returns:
        A list of parameter dictionaries (empty list if none available)

    """
    # First try with direct parameters (most reliable)
    if isinstance(obj, Function) and obj.parameters:
        params_data = []
        for param in obj.parameters:
            param_data = {"name": param.name}

            # Add type annotation if available
            if param.annotation:
                param_data["type"] = str(param.annotation)

            # Add default value if available
            if param.default:
                param_data["default"] = str(param.default)

            params_data.append(param_data)
        return params_data

    # Try from docstring if parameters aren't available
    if hasattr(obj, "docstring") and obj.docstring and hasattr(obj.docstring, "parsed"):
        params_data = []
        for section in obj.docstring.parsed:
            if section.kind == "parameters" and hasattr(section, "value"):
                for param in section.value:
                    if hasattr(param, "name"):
                        param_data = {"name": param.name}

                        # Add type annotation if available
                        if hasattr(param, "annotation") and param.annotation:
                            param_data["type"] = str(param.annotation)

                        # Add description if available
                        if hasattr(param, "description") and param.description:
                            param_data["description"] = str(param.description)

                        # Add default value if available
                        if hasattr(param, "default") and param.default:
                            param_data["default"] = str(param.default)

                        params_data.append(param_data)

        if params_data:
            return params_data

    # Return empty list if no parameters found
    return []


def extract_return_info(obj: Object | Alias) -> dict:
    """Extract return type information from a Griffe object if available.

    Args:
        obj: The Griffe object to extract return info from

    Returns:
        A dictionary with type and description (empty dict if none available)

    """
    return_info = {}

    # Handle aliases - set a default type for aliases (decorators)
    if isinstance(obj, Alias):
        return_info["type"] = "Callable"

        # Check if alias's target has annotation (getattr for type checking)
        if hasattr(obj, "target"):
            annotation = getattr(obj.target, "annotation", None)
            if annotation:
                return_info["type"] = str(annotation)

    # Get type from function's return annotation (most reliable)
    elif isinstance(obj, Function) and hasattr(obj, "returns") and obj.returns:
        return_info["type"] = str(obj.returns)

    # Try to get description from docstring's parsed sections
    if hasattr(obj, "docstring") and obj.docstring:
        if hasattr(obj.docstring, "parsed"):
            for section in obj.docstring.parsed:
                if section.kind == "returns" and hasattr(section, "value"):
                    # Add type from docstring if not already specified
                    if "type" not in return_info:
                        # Check if section has an annotation attribute directly
                        annotation = getattr(section, "annotation", None)
                        if annotation:
                            return_info["type"] = str(annotation)
                        # Or check if section has a value with annotation (for DocstringSectionReturns)
                        elif hasattr(section, "value"):
                            value_annotation = (
                                getattr(section.value, "annotation", None)
                                if not isinstance(section.value, (list, str))
                                else None
                            )
                            if value_annotation:
                                return_info["type"] = str(value_annotation)

                    # Add description if available
                    if hasattr(section, "value"):
                        if not isinstance(section.value, (list, str)):
                            description = getattr(section.value, "description", None)
                            if description:
                                return_info["description"] = str(description)
                                break  # Found what we need
                        elif isinstance(section.value, str):
                            return_info["description"] = str(section.value)
                            break  # Found what we need
                        elif isinstance(section.value, list) and len(section.value) > 0:
                            # Handle list of DocstringReturn objects
                            description = getattr(section.value[0], "description", None)
                            if description:
                                return_info["description"] = str(description)
                            break

        # If we still don't have return info, try to parse it from the raw docstring
        if ("description" not in return_info) and hasattr(obj.docstring, "value"):
            docstring_text = obj.docstring.value
            if "Returns:" in docstring_text:
                # Get the text after "Returns:"
                returns_text = docstring_text.split("Returns:")[1].strip()
                lines = returns_text.split("\n")

                # Get the indentation of the first line to determine the paragraph
                indent = len(lines[0]) - len(lines[0].lstrip()) if lines else 0

                # Extract the description - stop at first line with less indentation
                # or at first empty line
                description_lines = []
                for line in lines:
                    if not line.strip():
                        break
                    if line.startswith(" " * indent) or not indent:
                        description_lines.append(line.strip())
                    else:
                        break

                if description_lines:
                    # Join the lines and use as description
                    return_info["description"] = " ".join(description_lines)

                    # If no type but description mentions "decorator", set type to Callable
                    if (
                        "type" not in return_info
                        and "decorator" in return_info["description"].lower()
                    ):
                        return_info["type"] = "Callable"

    # Always return the dictionary (might be empty)
    return return_info


def format_signature(obj: Object | Alias) -> str | None:
    """Create a signature string from Griffe object's parameters.

    Args:
        obj: The Griffe object

    Returns:
        A formatted signature string if parameters can be extracted, None otherwise

    """
    name = obj.name
    params = extract_params_if_available(obj)

    # Don't display an empty signature
    if not params:
        return None

    # Format parameters for signature
    param_strs = []
    for param in params:
        param_str = param["name"]

        if "type" in param:
            param_str += f": {param['type']}"

        if "default" in param:
            param_str += f" = {param['default']}"

        param_strs.append(param_str)

    return f"{name}({', '.join(param_strs)})"


def get_object_type(obj: Object | Alias) -> str:
    """Determine the actual object type in a reliable way.

    Args:
        obj: The Griffe object

    Returns:
        A string representing the object type

    """
    # Check if we're dealing with a specific type
    if isinstance(obj, Function):
        return "Function"
    elif isinstance(obj, Class):
        return "Class"
    elif isinstance(obj, Module):
        return "Module"
    elif isinstance(obj, Alias):
        return "Alias"

    # Fallback to class name for other types (Method, etc.)
    return obj.__class__.__name__


def document_placeholder(obj: Object | Alias) -> str:
    """Generate documentation with enhanced component usage.

    Args:
        obj: The Griffe object

    Returns:
        MDX documentation with enhanced component usage

    """
    content: list[str] = []

    # Add object type using a component with consistent typing
    obj_type = get_object_type(obj)
    content.append(f'<ApiType type="{obj_type}" />\n')

    # Add enhanced signature using a component only if we can get a valid signature
    signature = format_signature(obj)
    if signature:
        content.append(f"<ApiSignature>\n{signature}\n</ApiSignature>\n")

    # Add docstring as usual
    if hasattr(obj, "docstring") and obj.docstring and obj.docstring.value:
        content.append("## Description\n")
        content.append(obj.docstring.value.strip())
        content.append("")

    # Extract parameters and add ParametersTable if available
    params = extract_params_if_available(obj)
    if params:
        # Convert the param dictionaries to JSON format with proper indentation
        import json

        params_json = json.dumps(params, indent=2)

        # Format the component with proper line breaks and proper JSX syntax
        # In JSX, we need to wrap arrays with curly braces, not square brackets
        content.append("<ParametersTable")
        content.append(f"  parameters={{{params_json}}}")
        content.append("/>\n")

    # Extract return type and add ReturnType if available
    return_info = extract_return_info(obj)
    if "type" in return_info:
        type_str = return_info.get("type", "")
        description = return_info.get("description", "")

        # Escape quotes in strings
        type_str = type_str.replace('"', '\\"')

        # Format the component with proper line breaks and proper JSX syntax
        content.append("<ReturnType")
        content.append(f'  type="{type_str}"')

        if description:
            # Properly escape newlines and quotes for JSX
            description = description.replace('"', '\\"').replace("\n", "\\n")
            content.append(f'  description="{description}"')

        content.append("/>\n")

    return "\n".join(content)
