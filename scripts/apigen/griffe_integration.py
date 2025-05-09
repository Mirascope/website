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
from scripts.apigen.mdx_renderer import (
    render_alias,
    render_function,
)
from scripts.apigen.models import process_alias, process_function

# Default content subpath for documentation
MODULE_CONTENT_SUBPATH = "docs/mirascope"


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
        raise ValueError("Unsupported object type:", current_obj)


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

                # Use document_class to generate class documentation
                class_docs = document_class(class_obj)
                # Split, remove the ApiType line, and join back
                class_docs_lines = class_docs.split("\n")
                content.append("\n".join(class_docs_lines))
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


def document_function(func_obj: Function) -> str:
    """Generate documentation for a Function object.

    Args:
        func_obj: The Function object to document

    Returns:
        MDX documentation with enhanced component usage

    """
    # Process the function into a structured model
    processed_func = process_function(func_obj)

    # Render the processed function to MDX
    return render_function(processed_func)


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
    # Process the alias into a structured model
    processed_alias = process_alias(alias_obj)

    # Render the processed alias to MDX
    return render_alias(processed_alias)
