"""Integration with Griffe for API documentation generation.

This module provides functionality to process API directives and generate
documentation using Griffe. The implementation focuses on generating clean,
accurate documentation with specialized handlers for different object types.
"""

import re
from pathlib import Path
from typing import Any

from griffe import GriffeLoader, Parser


def get_loader(source_repo_path: Path) -> GriffeLoader:
    """Create a configured Griffe loader.

    Args:
        source_repo_path: Path to the source repository

    Returns:
        A configured GriffeLoader instance

    """
    # Set up the parser for Google-style docstrings
    parser = Parser("google")

    # Create loader with specified docstring parser
    return GriffeLoader(docstring_parser=parser)


def process_directive(directive: str, module: Any) -> str:
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
    current_obj = module

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

    handlers = {
        "Function": document_placeholder,
        "Method": document_placeholder,
        "Class": document_placeholder,
        "Module": document_placeholder,
        "Alias": document_placeholder,
    }

    # Use the appropriate handler or a generic one if type not recognized
    handler = handlers.get(object_type, document_placeholder)
    return handler(current_obj)


def document_placeholder(obj: Any) -> str:
    """Generate placeholder documentation for non-function objects.

    This will be replaced with proper handlers for each object type.

    Args:
        obj: The Griffe object

    Returns:
        Simple markdown documentation

    """
    content = []

    # Add object type
    obj_type = obj.__class__.__name__
    content.append(f"**Type:** {obj_type}\n")

    # Add docstring if available
    if obj.docstring and obj.docstring.value:
        content.append("## Description\n")
        content.append(obj.docstring.value.strip())
        content.append("")

    return "\n".join(content)
