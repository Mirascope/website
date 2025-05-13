"""Data models for processed API documentation objects.

This module contains dataclasses representing API objects that have been
processed and prepared for rendering in various formats, along with functions
to create these models from Griffe objects.
"""

import logging
from dataclasses import dataclass

from griffe import (
    Alias,
    AliasResolutionError,
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

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


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
    bases: list[TypeInfo]
    members: list["ProcessedObject"]
    module_path: str


@dataclass
class ProcessedModule:
    """Represents a fully processed module ready for rendering.

    This dataclass contains all the information needed to render
    documentation for a module, extracted from Griffe objects.
    """

    name: str
    docstring: str | None
    members: list["ProcessedObject"]
    module_path: str


ProcessedObject = (
    ProcessedModule
    | ProcessedAlias
    | ProcessedAttribute
    | ProcessedClass
    | ProcessedFunction
)


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
        for base in class_obj.bases:
            base_str = str(base)
            try:
                base_type_info = parse_type_string(base_str)
                bases.append(base_type_info)
            except Exception as e:
                logger.warning(f"Failed to parse base class type: {base_str}. Error: {e}")
                # Fallback to simple type
                bases.append(SimpleType(type_str=base_str))

    # Process all members
    processed_members = []
    if hasattr(class_obj, "members"):
        for member_name, member in class_obj.members.items():
            # Skip private members (starting with underscore)
            if member_name.startswith("_"):
                continue

            processed_obj = process_object(member)
            if isinstance(processed_obj, ProcessedAlias):
                continue  # Don't document aliases on classes
            if processed_obj is not None:
                processed_members.append(processed_obj)

    # Create and return the processed class
    return ProcessedClass(
        name=name,
        docstring=docstring,
        bases=bases,
        members=processed_members,
        module_path=module_path,
    )


def process_attribute(obj: Attribute) -> ProcessedAttribute:
    name = getattr(obj, "name", "")
    type_info = extract_attribute_type_info(obj)
    descr = extract_clean_docstring(obj)
    return ProcessedAttribute(name=name, type_info=type_info, description=descr)


def process_object(obj: Object | Alias) -> ProcessedObject | None:
    """Process a Griffe object into the appropriate processed model.

    Args:
        obj: The Griffe object to process
        name: Optional name override for the object

    Returns:
        A processed object appropriate for the input type, or None for unsupported types

    """
    if isinstance(obj, Class):
        return process_class(obj)
    elif isinstance(obj, Function):
        return process_function(obj)
    elif isinstance(obj, Attribute):
        return process_attribute(obj)
    elif isinstance(obj, Alias):
        try:
            return process_alias(obj)
        except AliasResolutionError as e:
            logger.warning(e)
            return None
    elif isinstance(obj, Module):
        return process_module(obj)
    else:
        raise ValueError("Unexpected object", obj)


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

    # Process all members
    processed_members = []

    if hasattr(module_obj, "members"):
        # Process all members
        for member_name, member in module_obj.members.items():
            # Skip private members (starting with underscore)
            if member_name.startswith("_"):
                continue

            processed_obj = process_object(member)
            if isinstance(processed_obj, ProcessedAlias):
                # Don't document module aliases, they are noise
                continue
            if processed_obj is not None:
                processed_members.append(processed_obj)

    # Create and return the processed module
    return ProcessedModule(
        name=name,
        docstring=docstring,
        members=processed_members,
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
