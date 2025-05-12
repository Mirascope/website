"""Tests for the type_model module."""

from .type_model import (
    GenericType,
    SimpleType,
    parse_type_string,
    split_parameters,
)


def test_parse_simple_types():
    """Test parsing simple types."""
    # Test builtin types
    for builtin_type in ["str", "int", "float", "bool"]:
        type_info = parse_type_string(builtin_type, "test_module")

        assert isinstance(type_info, SimpleType)
        assert type_info.kind == "simple"
        assert type_info.type_str == builtin_type
        assert type_info.module_context == "test_module"
        assert type_info.is_builtin is True
        assert type_info.description is None

    # Test custom type
    custom_type = "MyCustomType"
    type_info = parse_type_string(custom_type, "test_module")

    assert isinstance(type_info, SimpleType)
    assert type_info.kind == "simple"
    assert type_info.type_str == custom_type
    assert type_info.module_context == "test_module"
    assert type_info.is_builtin is False
    assert type_info.description is None


def test_split_parameters():
    """Test the split_parameters function."""
    # Simple parameters
    assert split_parameters("str, int, bool") == ["str", "int", "bool"]

    # Nested parameters
    assert split_parameters("str, List[int], Dict[str, bool]") == [
        "str",
        "List[int]",
        "Dict[str, bool]",
    ]

    # Complex nesting
    assert split_parameters("str, Dict[str, List[int]], Set[Tuple[str, int]]") == [
        "str",
        "Dict[str, List[int]]",
        "Set[Tuple[str, int]]",
    ]


def test_parse_generic_types():
    """Test parsing generic types."""
    # Test simple generic type
    type_info = parse_type_string("List[str]", "test_module")

    assert isinstance(type_info, GenericType)
    assert type_info.kind == "generic"
    assert type_info.type_str == "List[str]"
    assert type_info.module_context == "test_module"
    assert type_info.is_builtin is True
    assert type_info.base_type == "List"
    assert len(type_info.parameters) == 1
    assert isinstance(type_info.parameters[0], SimpleType)
    assert type_info.parameters[0].type_str == "str"

    # Test generic type with multiple parameters
    type_info = parse_type_string("Dict[str, int]", "test_module")

    assert isinstance(type_info, GenericType)
    assert type_info.kind == "generic"
    assert type_info.type_str == "Dict[str, int]"
    assert type_info.base_type == "Dict"
    assert len(type_info.parameters) == 2
    assert type_info.parameters[0].type_str == "str"
    assert type_info.parameters[1].type_str == "int"

    # Test nested generic types
    type_info = parse_type_string("List[Dict[str, int]]", "test_module")

    assert isinstance(type_info, GenericType)
    assert type_info.kind == "generic"
    assert type_info.type_str == "List[Dict[str, int]]"
    assert type_info.base_type == "List"
    assert len(type_info.parameters) == 1

    inner_type = type_info.parameters[0]
    assert isinstance(inner_type, GenericType)
    assert inner_type.kind == "generic"
    assert inner_type.type_str == "Dict[str, int]"
    assert inner_type.base_type == "Dict"
    assert len(inner_type.parameters) == 2
    assert inner_type.parameters[0].type_str == "str"
    assert inner_type.parameters[1].type_str == "int"
