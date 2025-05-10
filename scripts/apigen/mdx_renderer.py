"""MDX renderer for processed API documentation objects.

This module provides functions to render processed API objects into MDX format
for documentation websites. It focuses purely on the rendering aspect, working
with pre-processed data models rather than directly with Griffe objects.
"""

import json

from scripts.apigen.models import (
    ProcessedAlias,
    ProcessedClass,
    ProcessedFunction,
    ProcessedModule,
)
from scripts.apigen.type_utils import parameters_to_dict_list

# Default content subpath for documentation
MODULE_CONTENT_SUBPATH = "docs/mirascope"


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

    # Render module attributes if any
    if processed_module.attributes:
        content.append("## Module Attributes\n")
        content.append("| Name | Type | Description |")
        content.append("| ---- | ---- | ----------- |")

        for attr in processed_module.attributes:
            attr_desc = attr.description or ""
            content.append(f"| {attr.name} | {attr.type_info} | {attr_desc} |")

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
    content_subpath = MODULE_CONTENT_SUBPATH

    # Add object type using a component with consistent typing
    content.append('<ApiType type="Function" />\n')

    # Add docstring if available
    if processed_func.docstring:
        content.append(processed_func.docstring.strip())
        content.append("")

    # Add parameters table if available
    if processed_func.parameters:
        content.extend(
            format_parameters_table(
                processed_func.parameters, content_subpath, processed_func.module_path
            )
        )

    # Add return type if available
    if processed_func.return_info:
        content.extend(
            format_return_type_component(
                processed_func.return_info, content_subpath, processed_func.module_path
            )
        )

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

    # Document attributes
    if processed_class.attributes:
        content.append("### Attributes\n")
        content.append("| Name | Type | Description |")
        content.append("| ---- | ---- | ----------- |")

        for attr in processed_class.attributes:
            attr_desc = attr.description or ""
            content.append(f"| {attr.name} | {attr.type_info} | {attr_desc} |")

        content.append("")

    return "\n".join(content)


def render_alias(processed_alias: ProcessedAlias) -> str:
    """Render a processed alias into MDX documentation.

    Args:
        processed_alias: The processed alias object to render

    Returns:
        MDX documentation string

    """
    content: list[str] = []
    content_subpath = MODULE_CONTENT_SUBPATH
    # Add docstring if available
    if processed_alias.docstring:
        content.append(processed_alias.docstring.strip())
        content.append("")

    # Add parameters table if available
    if processed_alias.parameters:
        content.extend(
            format_parameters_table(
                processed_alias.parameters, content_subpath, processed_alias.module_path
            )
        )

    # Add return type if available
    if processed_alias.return_info:
        content.extend(
            format_return_type_component(
                processed_alias.return_info,
                content_subpath,
                processed_alias.module_path,
            )
        )

    # Add what this is an alias to, if target path is available
    if processed_alias.target_path:
        content.append(f"\n**Alias to:** `{processed_alias.target_path}`")

    return "\n".join(content)


def format_return_type_component(
    return_info, content_subpath: str, module_path: str
) -> list[str]:
    """Format a ReturnType component from return type information.

    Args:
        return_info: The return type information
        content_subpath: The content subpath for documentation
        module_path: The module path for context

    Returns:
        List of strings representing the ReturnType component

    """
    component_lines = []

    type_info = return_info.type_info
    description = return_info.description
    type_str = type_info.type_str
    module_context = type_info.module_context

    # Escape quotes in strings
    type_str = type_str.replace('"', '\\"')
    if module_context:
        module_context = module_context.replace('"', '\\"')

    # Format the component with proper line breaks and proper JSX syntax
    component_lines.append("<ReturnType")
    component_lines.append(f'  type="{type_str}"')

    if module_context:
        component_lines.append(f'  moduleContext="{module_context}"')

    component_lines.append(f"  isBuiltin={{{str(type_info.is_builtin).lower()}}}")
    component_lines.append(f'  contentSubpath="{content_subpath}"')
    component_lines.append(f'  currentModule="{module_path}"')

    if description:
        # Properly escape newlines and quotes for JSX
        description = description.replace('"', '\\"').replace("\n", "\\n")
        component_lines.append(f'  description="{description}"')

    component_lines.append("/>\n")

    return component_lines


def format_parameters_table(
    params, content_subpath: str, module_path: str
) -> list[str]:
    """Format a ParametersTable component from parameter information.

    Args:
        params: List of parameter information objects
        content_subpath: The content subpath for documentation
        module_path: The module path for context

    Returns:
        List of strings representing the ParametersTable component

    """
    component_lines = []

    # Convert the param dictionaries to JSON format with proper indentation
    params_json = json.dumps(parameters_to_dict_list(params), indent=2)

    # Format the component with proper line breaks and proper JSX syntax
    component_lines.append("<ParametersTable")
    component_lines.append(f"  parameters={{{params_json}}}")
    component_lines.append(f'  contentSubpath="{content_subpath}"')
    component_lines.append(f'  currentModule="{module_path}"')
    component_lines.append("/>\n")

    return component_lines
