"""MDX renderer for processed API documentation objects.

This module provides functions to render processed API objects into MDX format
for documentation websites. It focuses purely on the rendering aspect, working
with pre-processed data models rather than directly with Griffe objects.
"""

import json

from scripts.apigen.models import (
    ProcessedAlias,
    ProcessedAttribute,
    ProcessedClass,
    ProcessedFunction,
    ProcessedModule,
)
from scripts.apigen.type_utils import ParameterInfo


def render_module(processed_module: ProcessedModule) -> str:
    """Render a processed module into MDX documentation.

    Args:
        processed_module: The processed module object to render

    Returns:
        MDX documentation string

    """
    content: list[str] = []

    # Add object type using a component with consistent typing
    content.append('<ApiType type="Module" />\n')

    # Add docstring if available
    if processed_module.docstring:
        content.append(processed_module.docstring.strip())
        content.append("")

    # Render module functions if any
    if processed_module.functions:
        content.append("## Functions\n")
        for func in processed_module.functions:
            content.append(f"### {func.name}\n")
            content.append(render_function(func))
            content.append("")

    # If classes are found, document them
    if processed_module.classes:
        if len(processed_module.classes) == 1:
            # If only one class and it has the same name as the last part of the module,
            # assume it's the primary class for this module
            processed_class = processed_module.classes[0]
            class_name = processed_class.name
            module_name_parts = processed_module.module_path.split(".")

            if module_name_parts and class_name.lower() == module_name_parts[-1]:
                # Document this as the primary class
                content.append(f"## Class {class_name}\n")
                content.append(render_class(processed_class))
            else:
                # Document the class but not as prominently
                content.append("## Classes\n")
                content.append(f"### {class_name}\n")
                content.append(render_class(processed_class))
                content.append("")
        else:
            # Multiple classes in the module, document all of them
            content.append("## Classes\n")
            for processed_class in processed_module.classes:
                content.append(f"### {processed_class.name}\n")
                content.append(render_class(processed_class))
                content.append("")

    return "\n".join(content)


def render_function(processed_func: ProcessedFunction) -> str:
    """Render a processed function into MDX documentation.

    Args:
        processed_func: The processed function object to render

    Returns:
        MDX documentation string

    """
    content: list[str] = []

    # Add object type using a component with consistent typing
    content.append('<ApiType type="Function" />\n')

    # Add docstring if available
    if processed_func.docstring:
        content.append(processed_func.docstring.strip())
        content.append("")

    # Add parameters table if available
    if processed_func.parameters:
        content.extend(format_parameters_table(processed_func.parameters))

    # Add return type if available
    if processed_func.return_info:
        content.extend(format_return_type_component(processed_func.return_info))

    return "\n".join(content)


def render_class(processed_class: ProcessedClass) -> str:
    """Render a processed class into MDX documentation.

    Args:
        processed_class: The processed class object to render

    Returns:
        MDX documentation string

    """
    content: list[str] = []

    # Add object type using a component with consistent typing
    content.append('<ApiType type="Class" />\n')

    # Add docstring if available
    if processed_class.docstring:
        content.append(processed_class.docstring.strip())
        content.append("")

    # Add information about base classes
    if processed_class.bases:
        bases_str = ", ".join(processed_class.bases)
        content.append(f"**Bases:** {bases_str}\n")

    # Document attributes using AttributesTable component
    if processed_class.attributes:
        content.extend(format_attributes_table(processed_class.attributes))

    return "\n".join(content)


def render_alias(processed_alias: ProcessedAlias) -> str:
    """Render a processed alias into MDX documentation.

    Args:
        processed_alias: The processed alias object to render

    Returns:
        MDX documentation string

    """
    content: list[str] = []
    # Add docstring if available
    if processed_alias.docstring:
        content.append(processed_alias.docstring.strip())
        content.append("")

    # Add parameters table if available
    if processed_alias.parameters:
        content.extend(format_parameters_table(processed_alias.parameters))

    # Add return type if available
    if processed_alias.return_info:
        content.extend(format_return_type_component(processed_alias.return_info))

    # Add what this is an alias to, if target path is available
    if processed_alias.target_path:
        content.append(f"\n**Alias to:** `{processed_alias.target_path}`")

    return "\n".join(content)


def format_return_type_component(return_info) -> list[str]:
    """Format a ReturnTable component from return type information.

    Args:
        return_info: The return type information

    Returns:
        List of strings representing the ReturnTable component

    """
    component_lines = []

    type_info = return_info.type_info
    description = return_info.description
    # We'll use the name field when we enhance the return_extractor
    name = getattr(return_info, "name", None)

    # Create a return type dictionary
    return_dict = {
        "type": type_info.type_str,
    }

    if description:
        return_dict["description"] = description

    if name:
        return_dict["name"] = name

    # Convert to JSON format with proper indentation
    return_json = json.dumps(return_dict, indent=2)

    # Format the component with proper line breaks and proper JSX syntax
    component_lines.append("<ReturnTable")
    component_lines.append(f"  returnType={{{return_json}}}")
    component_lines.append("/>\n")

    return component_lines


def format_parameters_table(params: list[ParameterInfo]) -> list[str]:
    """Format a ParametersTable component from parameter information.

    Args:
        params: List of parameter information objects

    Returns:
        List of strings representing the ParametersTable component

    """
    component_lines = []

    # Convert parameters to dictionaries inline
    param_dicts = []
    for param in params:
        param_dict = {"name": param.name}
        if param.type_info:
            param_dict["type"] = param.type_info.type_str
        if param.default:
            param_dict["default"] = param.default
        if param.description:
            param_dict["description"] = param.description
        param_dicts.append(param_dict)

    # Convert to JSON format with proper indentation
    params_json = json.dumps(param_dicts, indent=2)

    # Format the component with proper line breaks and proper JSX syntax
    component_lines.append("<ParametersTable")
    component_lines.append(f"  parameters={{{params_json}}}")
    component_lines.append("/>\n")

    return component_lines


def format_attributes_table(attrs: list[ProcessedAttribute]) -> list[str]:
    """Format an AttributesTable component from attribute information.

    Args:
        attrs: List of ProcessedAttribute objects

    Returns:
        List of strings representing the AttributesTable component

    """
    component_lines = []

    # Convert attributes to dictionaries inline
    attr_dicts = []
    for attr in attrs:
        attr_dict = {
            "name": attr.name,
            "type": attr.type_info,
        }
        if attr.description:
            attr_dict["description"] = attr.description
        attr_dicts.append(attr_dict)

    # Convert to JSON format with proper indentation
    attrs_json = json.dumps(attr_dicts, indent=2)

    # Format the component with proper line breaks and proper JSX syntax
    component_lines.append("<AttributesTable")
    component_lines.append(f"  attributes={{{attrs_json}}}")
    component_lines.append("/>\n")

    return component_lines
