"""Tests for the type_model module."""

from .type_model import (
    SimpleType,
    parse_type_string,
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
