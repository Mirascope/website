"""Integration with Griffe for API documentation generation.

This module provides functionality to process API directives and generate
documentation using Griffe. The implementation focuses on generating clean,
accurate documentation with specialized handlers for different object types.
"""

import re
from pathlib import Path

from griffe import (
    Alias,
    Class,
    Extensions,
    Function,
    GriffeLoader,
    Module,
    Object,
    Parser,
)

from scripts.apigen.doclinks import UpdateDocstringsExtension

# Default content subpath for documentation
MODULE_CONTENT_SUBPATH = "docs/mirascope"

# Common Python built-in types and modules
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


def process_directive_with_error_handling(directive: str, module: Module) -> str:
    """Process an API directive with error handling for missing dependencies.

    This wrapper catches errors during documentation generation, reports them,
    and provides placeholder documentation, allowing the process to continue
    even when dependencies are missing or other issues are encountered.

    Args:
        directive: The directive string (e.g., "::: mirascope.core.anthropic.call")
        module: The pre-loaded Griffe module

    Returns:
        The generated documentation content or error placeholder

    """
    try:
        return process_directive(directive, module)
    except KeyError as e:
        # Handle missing dependency issues (like opentelemetry not being available)
        object_path = directive.replace("::: ", "")
        missing_dep = str(e).strip("'")
        print(
            f"WARNING: Could not resolve dependency when processing {object_path}: {e}"
        )

        # Return basic placeholder documentation
        return f"""
## Missing Dependency Warning

Documentation for `{object_path}` could not be fully generated because of a missing dependency: `{missing_dep}`.

This is expected and safe to ignore for documentation generation purposes.
"""
    except Exception as e:
        # Add general error handling to make API docs generation more robust
        object_path = directive.replace("::: ", "")
        print(f"WARNING: Error processing directive {object_path}: {e}")

        return f"""
## Error Processing Documentation

An error occurred while generating documentation for `{object_path}`: {e!s}

Please check that all required dependencies are installed.
"""


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

    # Dispatch to appropriate handler based on object type
    if isinstance(current_obj, Module):
        return document_module(current_obj)
    elif isinstance(current_obj, Function):
        return document_function(current_obj)
    elif isinstance(current_obj, Class):
        return document_class(current_obj)
    elif isinstance(current_obj, Alias):
        return document_alias(current_obj)
    else:
        return document_fallback(current_obj)


def get_type_origin(annotation, module: Module) -> dict:
    """Find the origin module of a type annotation.

    Args:
        annotation: The type annotation to analyze
        module: The module that contains the type annotation

    Returns:
        A dictionary with information about the type origin

    """
    type_origin = {
        "module_path": module.path,
        "is_internal": True,
    }

    # Extract the base type name (without generic parameters or union pipes)
    base_type = str(annotation).split("[")[0].split("|")[0].strip()

    # Check if it's a fully qualified name (contains dots)
    if "." in base_type:
        parts = base_type.split(".")
        type_origin["module_path"] = ".".join(parts[:-1])
        type_origin["is_internal"] = True
        return type_origin

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
                            type_origin["module_path"] = ".".join(
                                target_path.split(".")[:-1]
                            )
                            return type_origin
                    else:
                        # For external packages like Pydantic, we can infer from the module name
                        # or use the current module context
                        type_origin["module_path"] = module.path
                        type_origin["is_internal"] = False
                        return type_origin

    if base_type in PYTHON_BUILTINS:
        type_origin["module_path"] = (
            "builtins"
            if base_type
            in {"str", "int", "float", "bool", "list", "dict", "tuple", "set"}
            else "typing"
        )
        type_origin["is_internal"] = False

    return type_origin


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
    # Get the containing module for context
    module = getattr(obj, "module", None)

    # First try with direct parameters (most reliable)
    if isinstance(obj, Function) and obj.parameters:
        params_data = []
        for param in obj.parameters:
            param_data = {"name": param.name}

            # Add type annotation if available
            if param.annotation:
                param_data["type"] = str(param.annotation)

                # Add type origin information
                if module:
                    type_origin = get_type_origin(param.annotation, module)
                    param_data["module_context"] = type_origin["module_path"]
                    param_data["is_builtin"] = str(
                        not type_origin["is_internal"]
                    ).lower()

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

                            # Add type origin information if we have module context
                            if module:
                                type_origin = get_type_origin(param.annotation, module)
                                param_data["module_context"] = type_origin[
                                    "module_path"
                                ]
                                param_data["is_builtin"] = str(
                                    not type_origin["is_internal"]
                                ).lower()

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

    # Get the containing module for context
    module = getattr(obj, "module", None)

    # Handle aliases - set a default type for aliases (decorators)
    if isinstance(obj, Alias):
        return_info["type"] = "Callable"

        # Check if alias's target has annotation (getattr for type checking)
        if hasattr(obj, "target"):
            annotation = getattr(obj.target, "annotation", None)
            if annotation:
                return_info["type"] = str(annotation)

                # Add type origin information
                if module:
                    type_origin = get_type_origin(annotation, module)
                    return_info["module_context"] = type_origin["module_path"]
                    return_info["is_builtin"] = str(
                        not type_origin["is_internal"]
                    ).lower()

    # Get type from function's return annotation (most reliable)
    elif isinstance(obj, Function) and hasattr(obj, "returns") and obj.returns:
        return_info["type"] = str(obj.returns)

        # Add type origin information
        if module:
            type_origin = get_type_origin(obj.returns, module)
            return_info["module_context"] = type_origin["module_path"]
            return_info["is_builtin"] = str(not type_origin["is_internal"]).lower()

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

                            # Add type origin information if not already present
                            if module and "module_context" not in return_info:
                                type_origin = get_type_origin(annotation, module)
                                return_info["module_context"] = type_origin[
                                    "module_path"
                                ]
                                return_info["is_builtin"] = str(
                                    not type_origin["is_internal"]
                                ).lower()

                        # Or check if section has a value with annotation (for DocstringSectionReturns)
                        elif hasattr(section, "value"):
                            value_annotation = (
                                getattr(section.value, "annotation", None)
                                if not isinstance(section.value, (list, str))
                                else None
                            )
                            if value_annotation:
                                return_info["type"] = str(value_annotation)

                                # Add type origin information if not already present
                                if module and "module_context" not in return_info:
                                    type_origin = get_type_origin(
                                        value_annotation, module
                                    )
                                    return_info["module_context"] = type_origin[
                                        "module_path"
                                    ]
                                    return_info["is_builtin"] = str(
                                        not type_origin["is_internal"]
                                    ).lower()

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

                        # Add type origin information for Callable if not already present
                        if module and "module_context" not in return_info:
                            return_info["module_context"] = "typing"
                            return_info["is_builtin"] = "true"

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


def document_module(module_obj: Module) -> str:
    """Generate documentation for a Module object.

    Args:
        module_obj: The Module object to document

    Returns:
        MDX documentation with enhanced component usage

    """
    content: list[str] = []
    module_path = getattr(module_obj, "path", "")

    # Add object type using a component with consistent typing
    content.append('<ApiType type="Module" />\n')

    # First handle the module's own docstring
    if (
        hasattr(module_obj, "docstring")
        and module_obj.docstring
        and module_obj.docstring.value
    ):
        content.append("## Description\n")
        content.append(module_obj.docstring.value.strip())
        content.append("")

    # Look for classes within the module
    classes = [
        (name, member)
        for name, member in module_obj.members.items()
        if isinstance(member, Class)
    ]

    # If classes are found, document them
    if classes:
        if len(classes) == 1:
            # If only one class and it has the same name as the last part of the module,
            # assume it's the primary class for this module
            class_name, class_obj = classes[0]
            module_name_parts = module_path.split(".")
            if module_name_parts and class_name.lower() == module_name_parts[-1]:
                # Document this as the primary class
                content.append(f"## Class {class_name}\n")

                # Add class docstring if available
                if (
                    hasattr(class_obj, "docstring")
                    and class_obj.docstring
                    and class_obj.docstring.value
                ):
                    content.append(class_obj.docstring.value.strip())
                    content.append("")

                # Add information about base classes
                if hasattr(class_obj, "bases") and class_obj.bases:
                    bases_str = ", ".join([str(base) for base in class_obj.bases])
                    content.append(f"**Bases:** {bases_str}\n")

                # Document attributes
                if hasattr(class_obj, "members"):
                    # Find all attributes (non-method members)
                    attributes = []
                    for attr_name, attr in class_obj.members.items():
                        # Check if it's not a function and doesn't start with underscore
                        if not isinstance(attr, Function) and not attr_name.startswith(
                            "_"
                        ):
                            attributes.append((attr_name, attr))

                    if attributes:
                        content.append("### Attributes\n")
                        content.append("| Name | Type | Description |")
                        content.append("| ---- | ---- | ----------- |")

                        for attr_name, attr in attributes:
                            attr_type = getattr(attr, "annotation", "")
                            attr_desc = ""
                            if hasattr(attr, "docstring") and attr.docstring:
                                attr_desc = attr.docstring.value.strip()
                            content.append(
                                f"| {attr_name} | {attr_type} | {attr_desc} |"
                            )
            else:
                # Document the class but not as prominently
                content.append("## Classes\n")
                for class_name, class_obj in classes:
                    content.append(f"### {class_name}\n")
                    if (
                        hasattr(class_obj, "docstring")
                        and class_obj.docstring
                        and class_obj.docstring.value
                    ):
                        content.append(class_obj.docstring.value.strip())
                    content.append("")
        else:
            # Multiple classes in the module, document all of them
            content.append("## Classes\n")
            for class_name, class_obj in classes:
                content.append(f"### {class_name}\n")
                if (
                    hasattr(class_obj, "docstring")
                    and class_obj.docstring
                    and class_obj.docstring.value
                ):
                    content.append(class_obj.docstring.value.strip())
                content.append("")

    return "\n".join(content)


def format_docstring_section(obj: Object | Alias) -> list[str]:
    """Format a docstring section from an object.

    Args:
        obj: The Griffe object with a docstring

    Returns:
        List of strings representing the docstring section, empty if no docstring

    """
    content = []
    if hasattr(obj, "docstring") and obj.docstring and obj.docstring.value:
        content.append("## Description\n")
        content.append(obj.docstring.value.strip())
        content.append("")
    return content


def format_return_type_component(
    return_info: dict, content_subpath: str, module_path: str
) -> list[str]:
    """Format a ReturnType component from return type information.

    Args:
        return_info: Dictionary containing return type information
        content_subpath: The content subpath for documentation
        module_path: The module path for context

    Returns:
        List of strings representing the ReturnType component

    """
    component_lines = []

    type_str = return_info.get("type", "")
    description = return_info.get("description", "")
    module_context = return_info.get("module_context", "")
    is_builtin = return_info.get("is_builtin", False)

    # Escape quotes in strings
    type_str = type_str.replace('"', '\\"')
    if module_context:
        module_context = module_context.replace('"', '\\"')

    # Format the component with proper line breaks and proper JSX syntax
    component_lines.append("<ReturnType")
    component_lines.append(f'  type="{type_str}"')

    if module_context:
        component_lines.append(f'  moduleContext="{module_context}"')

    component_lines.append(f"  isBuiltin={{{str(is_builtin).lower()}}}")
    component_lines.append(f'  contentSubpath="{content_subpath}"')
    component_lines.append(f'  currentModule="{module_path}"')

    if description:
        # Properly escape newlines and quotes for JSX
        description = description.replace('"', '\\"').replace("\n", "\\n")
        component_lines.append(f'  description="{description}"')

    component_lines.append("/>\n")

    return component_lines


def format_parameters_table(
    params: list[dict], content_subpath: str, module_path: str
) -> list[str]:
    """Format a ParametersTable component from parameter information.

    Args:
        params: List of parameter dictionaries
        content_subpath: The content subpath for documentation
        module_path: The module path for context

    Returns:
        List of strings representing the ParametersTable component

    """
    component_lines = []

    # Convert the param dictionaries to JSON format with proper indentation
    import json

    params_json = json.dumps(params, indent=2)

    # Format the component with proper line breaks and proper JSX syntax
    component_lines.append("<ParametersTable")
    component_lines.append(f"  parameters={{{params_json}}}")
    component_lines.append(f'  contentSubpath="{content_subpath}"')
    component_lines.append(f'  currentModule="{module_path}"')
    component_lines.append("/>\n")

    return component_lines


def document_function(func_obj: Function) -> str:
    """Generate documentation for a Function object.

    Args:
        func_obj: The Function object to document

    Returns:
        MDX documentation with enhanced component usage

    """
    content: list[str] = []

    # Determine the content subpath for this documentation
    module = getattr(func_obj, "module", None)
    module_path = getattr(module, "path", "")
    content_subpath = MODULE_CONTENT_SUBPATH

    # Add object type using a component with consistent typing
    content.append('<ApiType type="Function" />\n')

    # Add enhanced signature using a component if we can get a valid signature
    signature = format_signature(func_obj)
    if signature:
        content.append(f"<ApiSignature>\n{signature}\n</ApiSignature>\n")

    # Add docstring
    content.extend(format_docstring_section(func_obj))

    # Extract parameters and add ParametersTable if available
    params = extract_params_if_available(func_obj)
    if params:
        content.extend(format_parameters_table(params, content_subpath, module_path))

    # Extract return type and add ReturnType if available
    return_info = extract_return_info(func_obj)
    if "type" in return_info:
        content.extend(
            format_return_type_component(return_info, content_subpath, module_path)
        )

    return "\n".join(content)


def document_class(class_obj: Class) -> str:
    """Generate documentation for a Class object.

    Args:
        class_obj: The Class object to document

    Returns:
        MDX documentation with enhanced component usage

    """
    content: list[str] = []

    # Add object type using a component with consistent typing
    content.append('<ApiType type="Class" />\n')

    # Add docstring
    content.extend(format_docstring_section(class_obj))

    # Add information about base classes
    if hasattr(class_obj, "bases") and class_obj.bases:
        bases_str = ", ".join([str(base) for base in class_obj.bases])
        content.append(f"**Bases:** {bases_str}\n")

    # Document attributes
    if hasattr(class_obj, "members"):
        # Find all attributes (non-method members)
        attributes = []
        for attr_name, attr in class_obj.members.items():
            # Check if it's not a function and doesn't start with underscore
            if not isinstance(attr, Function) and not attr_name.startswith("_"):
                attributes.append((attr_name, attr))

        if attributes:
            content.append("### Attributes\n")
            content.append("| Name | Type | Description |")
            content.append("| ---- | ---- | ----------- |")

            for attr_name, attr in attributes:
                attr_type = getattr(attr, "annotation", "")
                attr_desc = ""
                if hasattr(attr, "docstring") and attr.docstring:
                    attr_desc = attr.docstring.value.strip()
                content.append(f"| {attr_name} | {attr_type} | {attr_desc} |")

            content.append("")

    return "\n".join(content)


def document_alias(alias_obj: Alias) -> str:
    """Generate documentation for an Alias object.

    Args:
        alias_obj: The Alias object to document

    Returns:
        MDX documentation with enhanced component usage

    """
    content: list[str] = []

    # Determine the content subpath for this documentation
    module = getattr(alias_obj, "module", None)
    module_path = getattr(module, "path", "")
    content_subpath = MODULE_CONTENT_SUBPATH

    # Add object type using a component with consistent typing
    content.append('<ApiType type="Alias" />\n')

    # Add enhanced signature using a component if we can get a valid signature
    signature = format_signature(alias_obj)
    if signature:
        content.append(f"<ApiSignature>\n{signature}\n</ApiSignature>\n")

    # Add docstring
    content.extend(format_docstring_section(alias_obj))

    # Extract parameters and add ParametersTable if available
    params = extract_params_if_available(alias_obj)
    if params:
        content.extend(format_parameters_table(params, content_subpath, module_path))

    # Extract return type and add ReturnType if available
    return_info = extract_return_info(alias_obj)
    if "type" in return_info:
        content.extend(
            format_return_type_component(return_info, content_subpath, module_path)
        )

    # Add what this is an alias to, if available
    if hasattr(alias_obj, "target") and alias_obj.target:
        target_path = getattr(alias_obj.target, "path", str(alias_obj.target))
        content.append(f"\n**Alias to:** `{target_path}`")

    return "\n".join(content)


def document_fallback(obj: Object | Alias) -> str:
    """Generate documentation for objects that don't match main types.

    Args:
        obj: The Griffe object to document

    Returns:
        MDX documentation with basic information

    """
    content: list[str] = []

    # Determine the content subpath for this documentation
    module = getattr(obj, "module", None)
    module_path = getattr(module, "path", "")
    content_subpath = MODULE_CONTENT_SUBPATH

    # Add object type using a component with consistent typing
    obj_type = get_object_type(obj)
    content.append(f'<ApiType type="{obj_type}" />\n')

    # Add enhanced signature using a component only if we can get a valid signature
    signature = format_signature(obj)
    if signature:
        content.append(f"<ApiSignature>\n{signature}\n</ApiSignature>\n")

    # Add docstring
    content.extend(format_docstring_section(obj))

    # Extract parameters and add ParametersTable if available
    params = extract_params_if_available(obj)
    if params:
        content.extend(format_parameters_table(params, content_subpath, module_path))

    # Extract return type and add ReturnType if available
    return_info = extract_return_info(obj)
    if "type" in return_info:
        content.extend(
            format_return_type_component(return_info, content_subpath, module_path)
        )

    return "\n".join(content)
