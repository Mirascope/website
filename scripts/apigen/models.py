"""Data models for processed API documentation objects.

This module contains dataclasses representing API objects that have been
processed and prepared for rendering in various formats, along with functions
to create these models from Griffe objects.
"""

from dataclasses import dataclass

from griffe import Function

from scripts.apigen.return_extractor import extract_return_info
from scripts.apigen.type_utils import (
    ParameterInfo,
    ReturnInfo,
    extract_params_if_available,
)


@dataclass
class ProcessedFunction:
    """Represents a fully processed function ready for rendering.

    This dataclass contains all the information needed to render
    documentation for a function, extracted from Griffe objects.
    """

    name: str
    docstring: str | None
    parameters: list[ParameterInfo]
    return_info: ReturnInfo | None
    module_path: str


def process_function(func_obj: Function) -> ProcessedFunction:
    """Process a Function object into a ProcessedFunction model.

    Args:
        func_obj: The Griffe Function object to process

    Returns:
        A ProcessedFunction object containing all necessary information

    """
    # Get basic function information
    name = getattr(func_obj, "name", "")

    # Extract module path
    module = getattr(func_obj, "module", None)
    module_path = getattr(module, "path", "")

    # Extract docstring
    docstring = None
    if (
        hasattr(func_obj, "docstring")
        and func_obj.docstring
        and func_obj.docstring.value
    ):
        docstring = func_obj.docstring.value.strip()

    # Extract parameters
    params = extract_params_if_available(func_obj)

    # Extract return type
    return_info = extract_return_info(func_obj)

    # Create and return the processed function
    return ProcessedFunction(
        name=name,
        docstring=docstring,
        parameters=params or [],
        return_info=return_info,
        module_path=module_path,
    )
