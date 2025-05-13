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
    ProcessedObject,
)
from scripts.apigen.type_model import EnumEncoder, ParameterInfo


def render_object(processed_obj: ProcessedObject, doc_path: str) -> str:
    """Render any processed object into MDX documentation.

    Args:
        processed_obj: The processed object to render
        doc_path: Path to the document, used for API component links

    Returns:
        MDX documentation string

    """
    if isinstance(processed_obj, ProcessedModule):
        return render_module(processed_obj, doc_path)
    elif isinstance(processed_obj, ProcessedClass):
        return render_class(processed_obj, doc_path)
    elif isinstance(processed_obj, ProcessedFunction):
        return render_function(processed_obj, doc_path)
    elif isinstance(processed_obj, ProcessedAttribute):
        return render_attribute(processed_obj, doc_path)
    elif isinstance(processed_obj, ProcessedAlias):
        return render_alias(processed_obj, doc_path)
    else:
        raise ValueError(f"Unsupported object type: {type(processed_obj)}")


def render_module(processed_module: ProcessedModule, doc_path: str) -> str:
    """Render a processed module into MDX documentation.

    Args:
        processed_module: The processed module object to render
        doc_path: Path to the document, used for API component links

    Returns:
        MDX documentation string

    """
    # Check total number of children across classes and functions
    total_items = len(processed_module.classes) + len(processed_module.functions)

    # If there's exactly one child item, render the module docstring followed by the item
    if total_items == 1:
        content = []

        # Add docstring if available (keeping important usage links)
        if processed_module.docstring:
            content.append(processed_module.docstring.strip())
            content.append("")

        # Add module attributes if any
        for attr in processed_module.attributes:
            content.append(render_attribute(attr, doc_path))
            content.append("")

        # Add the single item
        if processed_module.classes:
            # Single class - render it directly
            content.append(render_class(processed_module.classes[0], doc_path))
        elif processed_module.functions:
            # Single function - render it directly
            content.append(render_function(processed_module.functions[0], doc_path))

        return "\n".join(content)

    # Otherwise, use the standard module rendering approach
    content: list[str] = []

    # Get the module name for the heading
    module_name = processed_module.module_path.split(".")[-1]

    # Add heading with embedded ApiType component
    content.append(
        f'## <ApiType type="Module" path="{doc_path}" symbolName="{module_name}" /> {module_name}\n'
    )

    # Add docstring if available
    if processed_module.docstring:
        content.append(processed_module.docstring.strip())
        content.append("")

    # Add module attributes if any
    for attr in processed_module.attributes:
        content.append(render_attribute(attr, doc_path))
        content.append("")

    # Render module functions if any
    for func in processed_module.functions:
        content.append(render_function(func, doc_path))
        content.append("")

    for processed_class in processed_module.classes:
        content.append(render_class(processed_class, doc_path))
        content.append("")

    return "\n".join(content)


def render_function(processed_func: ProcessedFunction, doc_path: str) -> str:
    """Render a processed function into MDX documentation.

    Args:
        processed_func: The processed function object to render
        doc_path: Path to the document, used for API component links

    Returns:
        MDX documentation string

    """
    content: list[str] = []

    # Add heading with embedded ApiType component
    content.append(
        f'## <ApiType type="Function" path="{doc_path}" symbolName="{processed_func.name}" /> {processed_func.name}\n'
    )

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


def render_class(processed_class: ProcessedClass, doc_path: str) -> str:
    """Render a processed class into MDX documentation.

    Args:
        processed_class: The processed class object to render
        doc_path: Path to the document, used for API component links

    Returns:
        MDX documentation string

    """
    content: list[str] = []

    # Add heading with embedded ApiType component
    content.append(
        f'## <ApiType type="Class" path="{doc_path}" symbolName="{processed_class.name}" /> {processed_class.name}\n'
    )

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


def render_attribute(processed_attr: ProcessedAttribute, doc_path: str) -> str:
    """Render a processed attribute into MDX documentation.

    Args:
        processed_attr: The processed attribute object to render
        doc_path: Path to the document, used for API component links

    Returns:
        MDX documentation string

    """
    content: list[str] = []

    # Add heading with embedded ApiType component
    content.append(
        f'## <ApiType type="Attribute" path="{doc_path}" symbolName="{processed_attr.name}" /> {processed_attr.name}\n'
    )

    # Add type information
    type_str = json.dumps(processed_attr.type_info.to_dict(), cls=EnumEncoder)
    content.append(f"**Type:** <TypeLink type={{{type_str}}} />\n")

    # Add description if available
    if processed_attr.description:
        content.append(processed_attr.description.strip())
        content.append("")

    return "\n".join(content)


def render_alias(processed_alias: ProcessedAlias, doc_path: str) -> str:
    """Render a processed alias into MDX documentation.

    Args:
        processed_alias: The processed alias object to render
        doc_path: Path to the document, used for API component links

    Returns:
        MDX documentation string

    """
    content: list[str] = []

    # Add heading with embedded ApiType component
    content.append(
        f'## <ApiType type="Alias" path="{doc_path}" symbolName="{processed_alias.name}" /> {processed_alias.name}\n'
    )
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
    name = getattr(return_info, "name", None)

    # Create a return type dictionary with the full type_info object
    return_dict: dict[str, object] = {
        "type_info": type_info.to_dict(),
    }

    if description:
        return_dict["description"] = description

    if name:
        return_dict["name"] = name

    # Convert to JSON format with proper indentation
    return_json = json.dumps(return_dict, indent=2, cls=EnumEncoder)

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
        param_dict: dict[str, object] = {"name": param.name}
        if param.type_info:
            param_dict["type_info"] = param.type_info.to_dict()
        if param.default:
            param_dict["default"] = param.default
        if param.description:
            param_dict["description"] = param.description
        param_dicts.append(param_dict)

    # Convert to JSON format with proper indentation
    params_json = json.dumps(param_dicts, indent=2, cls=EnumEncoder)

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
        attr_dict: dict[str, object] = {
            "name": attr.name,
            "type_info": attr.type_info.to_dict(),  # Using the full type_info object
        }
        if attr.description:
            attr_dict["description"] = attr.description
        attr_dicts.append(attr_dict)

    # Convert to JSON format with proper indentation
    attrs_json = json.dumps(attr_dicts, indent=2, cls=EnumEncoder)

    # Format the component with proper line breaks and proper JSX syntax
    component_lines.append("<AttributesTable")
    component_lines.append(f"  attributes={{{attrs_json}}}")
    component_lines.append("/>\n")

    return component_lines
