"""Data models for processed API documentation objects.

This module contains dataclasses representing API objects that have been
processed and prepared for rendering in various formats, along with functions
to create these models from Griffe objects.
"""

from dataclasses import dataclass

from griffe import (
    Alias,
    Attribute,
    Class,
    DocstringSectionKind,
    Function,
    Module,
    Object,
)

from scripts.apigen.parser import parse_type_string
from scripts.apigen.type_extractor import extract_attribute_type_info, extract_type_info
from scripts.apigen.type_model import ParameterInfo, ReturnInfo, SimpleType, TypeInfo


def extract_clean_docstring(obj: Object | Alias) -> str | None:
    """Extract clean descriptive text from a docstring.

    This function extracts only the descriptive text sections from a docstring,
    excluding parameter, returns, and other sections that would be redundant with
    our structured rendering of the API documentation.

    Args:
        obj: The Griffe object to extract the docstring from

    Returns:
        The clean docstring text, or None if no docstring is available

    """
    # Check if docstring is available
    if not (hasattr(obj, "docstring") and obj.docstring):
        return None

    # Extract text sections from the parsed docstring
    text_sections = []

    for section in obj.docstring.parsed:
        if section.kind == DocstringSectionKind.text:
            if hasattr(section, "value") and section.value:
                text_sections.append(str(section.value).strip())

    # Join text sections with newlines
    if text_sections:
        return "\n\n".join(text_sections)

    # Fallback to raw value if no text sections were found
    return obj.docstring.value.strip() if obj.docstring.value else None


@dataclass
class ProcessedAttribute:
    """Represents a fully processed class attribute ready for rendering."""

    name: str
    type_info: TypeInfo  # Using the TypeInfo from type_model
    description: str | None


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


@dataclass
class ProcessedAlias:
    """Represents a fully processed alias ready for rendering.

    This dataclass contains all the information needed to render
    documentation for an alias, extracted from Griffe objects.
    """

    name: str
    docstring: str | None
    parameters: list[ParameterInfo]
    return_info: ReturnInfo | None
    target_path: str
    module_path: str


@dataclass
class ProcessedClass:
    """Represents a fully processed class ready for rendering.

    This dataclass contains all the information needed to render
    documentation for a class, extracted from Griffe objects.
    """

    name: str
    docstring: str | None
    bases: list[str]
    attributes: list[ProcessedAttribute]
    module_path: str


@dataclass
class ProcessedModule:
    """Represents a fully processed module ready for rendering.

    This dataclass contains all the information needed to render
    documentation for a module, extracted from Griffe objects.
    """

    name: str
    docstring: str | None
    classes: list[ProcessedClass]
    attributes: list[ProcessedAttribute]
    functions: list[ProcessedFunction]
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

    # Extract clean docstring
    docstring = extract_clean_docstring(func_obj)

    # Extract parameters and return type
    params, return_info = extract_type_info(func_obj)

    # Create and return the processed function
    return ProcessedFunction(
        name=name,
        docstring=docstring,
        parameters=params or [],
        return_info=return_info,
        module_path=module_path,
    )


def process_class(class_obj: Class) -> ProcessedClass:
    """Process a Class object into a ProcessedClass model.

    Args:
        class_obj: The Griffe Class object to process

    Returns:
        A ProcessedClass object containing all necessary information

    """
    # Get basic class information
    name = getattr(class_obj, "name", "")

    # Extract module path
    module = getattr(class_obj, "module", None)
    module_path = getattr(module, "path", "")

    # Extract clean docstring
    docstring = extract_clean_docstring(class_obj)

    # Extract base classes
    bases = []
    if hasattr(class_obj, "bases") and class_obj.bases:
        bases = [str(base) for base in class_obj.bases]

    # Extract attributes
    attributes = []
    if hasattr(class_obj, "members"):
        for attr_name, attr in class_obj.members.items():
            # Check if it's not a function and doesn't start with underscore
            if not isinstance(attr, Function) and not attr_name.startswith("_"):
                # Get the type annotation as a string
                attr_type_str = str(getattr(attr, "annotation", ""))
                # Use a default "Any" type for empty annotations
                if attr_type_str.strip():
                    # Try to parse the string into a TypeInfo object, with fallback
                    try:
                        attr_type_info = parse_type_string(attr_type_str)
                    except Exception as e:
                        # Print a warning with the failed type string
                        print(
                            f"WARNING: Failed to parse type annotation: '{attr_type_str}'. Error: {e}"
                        )
                        # Fallback to simple type with the original string
                        attr_type_info = SimpleType(type_str=attr_type_str)
                else:
                    # Create a simple "Any" type for empty annotations
                    attr_type_info = SimpleType(type_str="Any")
                attr_desc = extract_clean_docstring(attr)

                processed_attr = ProcessedAttribute(
                    name=attr_name,
                    type_info=attr_type_info,
                    description=attr_desc,
                )
                attributes.append(processed_attr)

    # Create and return the processed class
    return ProcessedClass(
        name=name,
        docstring=docstring,
        bases=bases,
        attributes=attributes,
        module_path=module_path,
    )


def process_attribute(obj: Attribute) -> ProcessedAttribute:
    name = getattr(obj, "name", "")
    type_info = extract_attribute_type_info(obj)
    descr = extract_clean_docstring(obj)
    return ProcessedAttribute(name=name, type_info=type_info, description=descr)


def process_module(module_obj: Module) -> ProcessedModule:
    """Process a Module object into a ProcessedModule model.

    Args:
        module_obj: The Griffe Module object to process

    Returns:
        A ProcessedModule object containing all necessary information

    """
    # Get basic module information
    name = getattr(module_obj, "name", "")
    module_path = getattr(module_obj, "path", "")

    # Extract clean docstring
    docstring = extract_clean_docstring(module_obj)

    # Initialize collections for different member types
    processed_classes = []
    processed_functions = []
    processed_attributes = []

    if hasattr(module_obj, "members"):
        # Process all members
        for member_name, member in module_obj.members.items():
            # Skip private members (starting with underscore)
            if member_name.startswith("_"):
                continue

            # Process classes
            if isinstance(member, Class):
                processed_class = process_class(member)
                processed_classes.append(processed_class)

            if isinstance(member, Alias):
                pass  # TODO: Figure out support

            # Process functions
            elif isinstance(member, Function):
                processed_function = process_function(member)
                processed_functions.append(processed_function)

            # Process attributes (not classes, functions, or aliases)
            elif isinstance(member, Attribute):
                processed_attribute = process_attribute(member)
                processed_attributes.append(processed_attribute)
            else:
                # Get the type annotation as a string
                attr_type_str = str(getattr(member, "annotation", ""))
                # Use a default "Any" type for empty annotations
                if attr_type_str.strip():
                    # Try to parse the string into a TypeInfo object, with fallback
                    try:
                        attr_type_info = parse_type_string(attr_type_str)
                    except Exception as e:
                        # Print a warning with the failed type string
                        print(
                            f"WARNING: Failed to parse type annotation: '{attr_type_str}'. Error: {e}"
                        )
                        # Fallback to simple type with the original string
                        attr_type_info = SimpleType(type_str=attr_type_str)
                else:
                    # Create a simple "Any" type for empty annotations
                    attr_type_info = SimpleType(type_str="Any")
                attr_desc = extract_clean_docstring(member)

                processed_attr = ProcessedAttribute(
                    name=member_name,
                    type_info=attr_type_info,
                    description=attr_desc,
                )
                processed_attributes.append(processed_attr)

    # Create and return the processed module
    return ProcessedModule(
        name=name,
        docstring=docstring,
        classes=processed_classes,
        attributes=processed_attributes,
        functions=processed_functions,
        module_path=module_path,
    )


def process_alias(alias_obj: Alias) -> ProcessedAlias:
    """Process an Alias object into a ProcessedAlias model.

    Args:
        alias_obj: The Griffe Alias object to process

    Returns:
        A ProcessedAlias object containing all necessary information

    """
    # Get basic alias information
    name = getattr(alias_obj, "name", "")

    # Extract module path
    module = getattr(alias_obj, "module", None)
    module_path = getattr(module, "path", "")

    # Extract clean docstring
    docstring = extract_clean_docstring(alias_obj)

    # Extract parameters and return type
    params, return_info = extract_type_info(alias_obj)

    # Extract target path
    target_path = ""
    if hasattr(alias_obj, "target") and alias_obj.target:
        target_path = getattr(alias_obj.target, "path", str(alias_obj.target))

    # Create and return the processed alias
    return ProcessedAlias(
        name=name,
        docstring=docstring,
        parameters=params or [],
        return_info=return_info,
        target_path=target_path,
        module_path=module_path,
    )
