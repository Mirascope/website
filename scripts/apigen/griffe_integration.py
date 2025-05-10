"""Integration with Griffe for API documentation generation.

This module provides functionality to process API directives and generate
documentation using Griffe. The implementation follows a clear model-view
pattern where:
1. Data is extracted and processed into structured models (via process_* functions)
2. Models are rendered into MDX format (via render_* functions)
3. Error handling ensures graceful fallbacks for missing dependencies

The code is organized in the following sections:
- Configuration: Loader setup for parsing docstrings
- Documentation Generation: Core object processing and rendering
- Directive Processing: Handling API directives and error cases
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
    render_class,
    render_function,
    render_module,
)
from scripts.apigen.models import (
    process_alias,
    process_class,
    process_function,
    process_module,
)

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


def generate_error_placeholder(object_path: str, error: Exception) -> str:
    """Generate placeholder documentation for errors.

    Args:
        object_path: The path of the object that failed to process
        error: The exception that was raised

    Returns:
        Placeholder documentation with error details

    """
    if isinstance(error, KeyError):
        # Handle missing dependency issues (like opentelemetry not being available)
        missing_dep = str(error).strip("'")
        print(
            f"WARNING: Could not resolve dependency when processing {object_path}: {error}"
        )

        return f"""
## Missing Dependency Warning

Documentation for `{object_path}` could not be fully generated because of a missing dependency: `{missing_dep}`.

This is expected and safe to ignore for documentation generation purposes.
"""
    else:
        # Add general error handling to make API docs generation more robust
        print(f"WARNING: Error processing directive {object_path}: {error}")

        return f"""
## Error Processing Documentation

An error occurred while generating documentation for `{object_path}`: {error!s}

Please check that all required dependencies are installed.
"""


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
    except Exception as e:
        object_path = directive.replace("::: ", "")
        return generate_error_placeholder(object_path, e)


def document_object(obj: Object | Alias) -> str:
    """Generate documentation for any supported Griffe object type.

    Args:
        obj: The Griffe object to document

    Returns:
        MDX documentation with enhanced component usage

    """
    if isinstance(obj, Module):
        processed_obj = process_module(obj)
        return render_module(processed_obj)
    elif isinstance(obj, Function):
        processed_obj = process_function(obj)
        return render_function(processed_obj)
    elif isinstance(obj, Class):
        processed_obj = process_class(obj)
        return render_class(processed_obj)
    elif isinstance(obj, Alias):
        processed_obj = process_alias(obj)
        return render_alias(processed_obj)
    else:
        raise ValueError(f"Unsupported object type: {type(obj)}")


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

    # Use the document_object dispatcher function
    return document_object(current_obj)
