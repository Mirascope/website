"""Tests for the type_urls module and its integration with type_model and parser."""

import json

from .parser import parse_type_string
from .type_model import GenericType, SimpleType
from .type_urls import BUILTIN_TYPE_URLS, get_doc_url_for_type


def test_get_doc_url_for_type():
    """Test the get_doc_url_for_type function."""
    # Test existing builtin types
    assert get_doc_url_for_type("str") == BUILTIN_TYPE_URLS["str"]
    assert get_doc_url_for_type("int") == BUILTIN_TYPE_URLS["int"]
    assert get_doc_url_for_type("list") == BUILTIN_TYPE_URLS["list"]

    # Test with quotes (which should be stripped)
    assert get_doc_url_for_type("'str'") == BUILTIN_TYPE_URLS["str"]
    assert get_doc_url_for_type('"int"') == BUILTIN_TYPE_URLS["int"]

    # Test non-existent type
    assert get_doc_url_for_type("NonExistentType") is None


def test_simple_type_with_doc_url():
    """Test creating a SimpleType with a doc_url."""
    # Create a SimpleType with doc_url
    doc_url = "https://docs.python.org/3/library/stdtypes.html#str"
    simple_type = SimpleType(type_str="str", doc_url=doc_url)

    # Check the doc_url field is set correctly
    assert simple_type.doc_url == doc_url

    # Check the doc_url field is included in the JSON output
    json_output = json.loads(simple_type.to_json())
    assert json_output["doc_url"] == doc_url


def test_parser_sets_doc_url():
    """Test that the parser sets the doc_url field for builtin types."""
    # Test parsing a simple builtin type
    str_type = parse_type_string("str")
    assert isinstance(str_type, SimpleType)
    assert str_type.doc_url == BUILTIN_TYPE_URLS["str"]

    # Test parsing int
    int_type = parse_type_string("int")
    assert isinstance(int_type, SimpleType)
    assert int_type.doc_url == BUILTIN_TYPE_URLS["int"]

    # Test parsing a custom type (should not have a doc_url)
    custom_type = parse_type_string("CustomType")
    assert isinstance(custom_type, SimpleType)
    assert custom_type.doc_url is None


def test_parser_sets_doc_url_in_generics():
    """Test that the parser sets doc_url for base types in generics."""
    # Test parsing a generic type
    list_type = parse_type_string("List[str]")
    assert isinstance(list_type, GenericType)
    assert list_type.base_type.doc_url == BUILTIN_TYPE_URLS["List"]

    # Check that the parameter also has doc_url
    assert isinstance(list_type.parameters[0], SimpleType)
    assert list_type.parameters[0].doc_url == BUILTIN_TYPE_URLS["str"]

    # Test more complex generic
    dict_type = parse_type_string("Dict[str, int]")
    assert isinstance(dict_type, GenericType)
    assert dict_type.base_type.doc_url == BUILTIN_TYPE_URLS["Dict"]
    assert isinstance(dict_type.parameters[0], SimpleType)
    assert dict_type.parameters[0].doc_url == BUILTIN_TYPE_URLS["str"]
    assert isinstance(dict_type.parameters[1], SimpleType)
    assert dict_type.parameters[1].doc_url == BUILTIN_TYPE_URLS["int"]

    # Test nested generic
    nested_type = parse_type_string("List[Dict[str, int]]")
    assert isinstance(nested_type, GenericType)
    assert nested_type.base_type.doc_url == BUILTIN_TYPE_URLS["List"]
    assert isinstance(nested_type.parameters[0], GenericType)
    assert nested_type.parameters[0].base_type.doc_url == BUILTIN_TYPE_URLS["Dict"]


def test_parser_sets_doc_url_in_unions():
    """Test that the parser sets doc_url for types in unions."""
    # Test parsing a union type
    union_type = parse_type_string("str | int")
    assert isinstance(union_type, GenericType)
    # Union base type might not have a doc_url set in implicit union syntax
    assert isinstance(union_type.parameters[0], SimpleType)
    assert union_type.parameters[0].doc_url == BUILTIN_TYPE_URLS["str"]
    assert isinstance(union_type.parameters[1], SimpleType)
    assert union_type.parameters[1].doc_url == BUILTIN_TYPE_URLS["int"]

    # Test Union[] syntax - here the base type should have a doc_url
    union_type_explicit = parse_type_string("Union[str, int]")
    assert isinstance(union_type_explicit, GenericType)
    assert union_type_explicit.base_type.doc_url == BUILTIN_TYPE_URLS["Union"]
    assert isinstance(union_type_explicit.parameters[0], SimpleType)
    assert union_type_explicit.parameters[0].doc_url == BUILTIN_TYPE_URLS["str"]
    assert isinstance(union_type_explicit.parameters[1], SimpleType)
    assert union_type_explicit.parameters[1].doc_url == BUILTIN_TYPE_URLS["int"]
