"""Return type extraction logic for API documentation generation.

This module provides structured representations and utilities for extracting
return type information from Python functions and methods within the API documentation system.
"""

from griffe import Alias, Function, Module, Object

from .type_utils import ReturnInfo, get_type_origin


class ReturnExtractor:
    """Extracts return type information from a Griffe object.

    This class encapsulates the logic for extracting return type information
    from various sources in a Griffe object (Function, Alias, docstring).
    """

    def __init__(self, obj: Object | Alias):
        """Initialize the extractor with a Griffe object.

        Args:
            obj: The Griffe object to extract return info from

        """
        self.obj: Object | Alias = obj
        self.module: Module | None = obj.module
        self.type_str: str | None = None
        self.annotation: object | None = None
        self.description: str | None = None

    def extract(self) -> ReturnInfo | None:
        """Extract return type information from all available sources.

        Returns:
            ReturnInfo object if available, None otherwise

        """
        # Early return if no module is available
        if not self.module:
            return None

        # Try extractions in priority order
        if isinstance(self.obj, Alias):
            self._extract_from_alias()
        elif isinstance(self.obj, Function):
            self._extract_from_function()

        # Always try docstring for additional info
        self._extract_from_docstring()

        # Create and return ReturnInfo if we have enough information
        return self._build_return_info()

    def _extract_from_alias(self) -> None:
        """Extract return type information from an Alias object."""
        # Default type for aliases (decorators)
        self.type_str = "Callable"

        # Check if alias's target has annotation (Alias objects can have target)
        if isinstance(self.obj, Alias) and hasattr(self.obj, "target"):
            annotation = getattr(self.obj.target, "annotation", None)
            if annotation:
                self.annotation = annotation
                self.type_str = str(annotation)

    def _extract_from_function(self) -> None:
        """Extract return type information from a Function object."""
        # Function objects can have returns attribute
        if (
            isinstance(self.obj, Function)
            and hasattr(self.obj, "returns")
            and self.obj.returns
        ):
            self.annotation = self.obj.returns
            self.type_str = str(self.obj.returns)

    def _extract_from_docstring(self) -> None:
        """Extract return type and description from docstring sections."""
        # Skip if docstring is not available or not properly parsed
        if not (
            hasattr(self.obj, "docstring")
            and self.obj.docstring
            and hasattr(self.obj.docstring, "parsed")
        ):
            return

        # Process docstring sections
        for section in self.obj.docstring.parsed:
            if section.kind == "returns" and hasattr(section, "value"):
                self._process_returns_section(section)
                break  # Stop after processing the first returns section

    def _process_returns_section(self, section) -> None:
        """Process a returns section from the docstring.

        Args:
            section: The returns section to process

        """
        # Try to extract type annotation if not already set
        if not self.type_str:
            self._extract_type_from_section(section)

        # Always try to extract description
        self._extract_description_from_section(section)

    def _extract_type_from_section(self, section) -> None:
        """Extract type annotation from a docstring section.

        Args:
            section: The section to extract type from

        """
        # Check if section has an annotation attribute directly
        section_annotation = getattr(section, "annotation", None)
        if section_annotation:
            self.annotation = section_annotation
            self.type_str = str(section_annotation)
            return

        # Or check if section has a value with annotation
        if hasattr(section, "value"):
            section_value = section.value
            if not isinstance(section_value, (list, str)):
                value_annotation = getattr(section_value, "annotation", None)
                if value_annotation:
                    self.annotation = value_annotation
                    self.type_str = str(value_annotation)

    def _extract_description_from_section(self, section) -> None:
        """Extract description from a docstring section.

        Args:
            section: The section to extract description from

        """
        if not hasattr(section, "value"):
            return

        section_value = section.value

        # Handle string descriptions
        if isinstance(section_value, str):
            self.description = str(section_value)

        # Handle list of DocstringReturn objects
        elif isinstance(section_value, list) and section_value:
            description = getattr(section_value[0], "description", None)
            if description:
                self.description = str(description)

        # Handle other object types
        elif not isinstance(section_value, (list, str)):
            description = getattr(section_value, "description", None)
            if description:
                self.description = str(description)

    def _build_return_info(self) -> ReturnInfo | None:
        """Build a ReturnInfo object from the extracted information.

        Returns:
            ReturnInfo object if type information is available, None otherwise

        """
        if not self.type_str or not self.module:
            return None

        # We know self.module is not None at this point
        module = self.module
        type_info = get_type_origin(
            self.annotation if self.annotation else self.type_str, module
        )
        return ReturnInfo(type_info=type_info, description=self.description)


def extract_return_info(obj: Object | Alias) -> ReturnInfo | None:
    """Extract return type information from a Griffe object.

    Args:
        obj: The Griffe object to extract return info from

    Returns:
        ReturnInfo object if available, None otherwise

    """
    return ReturnExtractor(obj).extract()
