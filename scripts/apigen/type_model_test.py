"""Tests for the type_model module."""

import json

from .type_model import (
    GenericType,
    SimpleType,
    parse_type_string,
    split_parameters,
)


def assert_json_equal(actual, expected):
    """Assert that two objects are equal when serialized to JSON."""
    actual_json = json.loads(actual.to_json())
    expected_json = json.loads(expected.to_json())
    assert actual_json == expected_json, f"JSON not equal: {json.dumps(actual_json)} != {json.dumps(expected_json)}"


def test_parse_simple_types():
    """Test parsing simple types."""
    # Test builtin types
    for builtin_type in ["str", "int", "float", "bool"]:
        type_info = parse_type_string(builtin_type)

        assert isinstance(type_info, SimpleType)
        assert type_info.kind == "simple"
        assert type_info.type_str == builtin_type
        assert type_info.description is None

    # Test custom type
    custom_type = "MyCustomType"
    type_info = parse_type_string(custom_type)

    assert isinstance(type_info, SimpleType)
    assert type_info.kind == "simple"
    assert type_info.type_str == custom_type
    assert type_info.description is None
    
    # Test fully qualified type
    qualified_type = "mirascope.core.base.Response"
    type_info = parse_type_string(qualified_type)
    
    assert isinstance(type_info, SimpleType)
    assert type_info.kind == "simple"
    assert type_info.type_str == qualified_type


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
    type_info = parse_type_string("List[str]")

    assert isinstance(type_info, GenericType)
    assert type_info.kind == "generic"
    assert type_info.type_str == "List[str]"
    assert isinstance(type_info.base_type, SimpleType)
    assert type_info.base_type.type_str == "List"
    assert len(type_info.parameters) == 1
    assert isinstance(type_info.parameters[0], SimpleType)
    assert type_info.parameters[0].type_str == "str"

    # Test generic type with multiple parameters
    type_info = parse_type_string("Dict[str, int]")

    assert isinstance(type_info, GenericType)
    assert type_info.kind == "generic"
    assert type_info.type_str == "Dict[str, int]"
    assert isinstance(type_info.base_type, SimpleType)
    assert type_info.base_type.type_str == "Dict"
    assert len(type_info.parameters) == 2
    assert type_info.parameters[0].type_str == "str"
    assert type_info.parameters[1].type_str == "int"

    # Test nested generic types
    type_info = parse_type_string("List[Dict[str, int]]")

    assert isinstance(type_info, GenericType)
    assert type_info.kind == "generic"
    assert type_info.type_str == "List[Dict[str, int]]"
    assert isinstance(type_info.base_type, SimpleType)
    assert type_info.base_type.type_str == "List"
    assert len(type_info.parameters) == 1

    inner_type = type_info.parameters[0]
    assert isinstance(inner_type, GenericType)
    assert inner_type.kind == "generic"
    assert inner_type.type_str == "Dict[str, int]"
    assert isinstance(inner_type.base_type, SimpleType)
    assert inner_type.base_type.type_str == "Dict"
    assert len(inner_type.parameters) == 2
    assert inner_type.parameters[0].type_str == "str"
    assert inner_type.parameters[1].type_str == "int"


def test_json_serialization():
    """Test JSON serialization of type models."""
    # Test simple type
    type_info = SimpleType(
        type_str="str",
    )
    
    # Serialize and deserialize
    json_str = type_info.to_json()
    parsed = json.loads(json_str)
    
    # Check fields are preserved
    assert parsed["type_str"] == "str"
    assert parsed["kind"] == "simple"
    
    # Test generic type with nested structure
    nested_type = GenericType(
        type_str="List[Dict[str, int]]",
        base_type=SimpleType(type_str="List"),
        parameters=[
            GenericType(
                type_str="Dict[str, int]",
                base_type=SimpleType(type_str="Dict"),
                parameters=[
                    SimpleType(type_str="str"),
                    SimpleType(type_str="int")
                ]
            )
        ]
    )
    
    # Parse the same string
    parsed_type = parse_type_string("List[Dict[str, int]]")
    
    # Compare using JSON equality
    assert_json_equal(parsed_type, nested_type)
    
    # Snapshot test to show exact JSON format
    expected_json_snapshot = {
        "kind": "generic",
        "type_str": "List[Dict[str, int]]",
        "description": None,
        "base_type": {
            "kind": "simple",
            "type_str": "List",
            "description": None
        },
        "parameters": [
            {
                "kind": "generic",
                "type_str": "Dict[str, int]",
                "description": None,
                "base_type": {
                    "kind": "simple",
                    "type_str": "Dict",
                    "description": None
                },
                "parameters": [
                    {
                        "kind": "simple",
                        "type_str": "str",
                        "description": None
                    },
                    {
                        "kind": "simple",
                        "type_str": "int",
                        "description": None
                    }
                ]
            }
        ]
    }
    
    # Verify the exact JSON structure matches our expectation
    actual_json = json.loads(nested_type.to_json())
    assert actual_json == expected_json_snapshot, "JSON snapshot does not match expected format"


def test_parse_qualified_types():
    """Test parsing fully qualified types."""
    # Test fully qualified generic type
    type_info = parse_type_string("mirascope.core.List[mirascope.types.Response]")
    
    assert isinstance(type_info, GenericType)
    assert type_info.kind == "generic"
    assert type_info.type_str == "mirascope.core.List[mirascope.types.Response]"
    assert isinstance(type_info.base_type, SimpleType)
    assert type_info.base_type.type_str == "mirascope.core.List"
    assert len(type_info.parameters) == 1
    assert type_info.parameters[0].type_str == "mirascope.types.Response"