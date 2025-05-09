"""MDX renderer for processed API documentation objects.

This module provides functions to render processed API objects into MDX format
for documentation websites. It focuses purely on the rendering aspect, working
with pre-processed data models rather than directly with Griffe objects.
"""

import json

from scripts.apigen.models import ProcessedFunction
from scripts.apigen.type_utils import parameters_to_dict_list

# Default content subpath for documentation
MODULE_CONTENT_SUBPATH = "docs/mirascope"


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
        content.append("## Description\n")
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
