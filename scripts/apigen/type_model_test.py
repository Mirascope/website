"""Tests for the type_model module."""

import json

from .type_model import EnumEncoder, GenericType, SimpleType, TypeKind


def assert_json_equal(actual, expected):
    """Assert that two objects are equal when serialized to JSON."""
    actual_json = json.loads(actual.to_json())
    expected_json = json.loads(expected.to_json())
    assert actual_json == expected_json, (
        f"JSON not equal: {json.dumps(actual_json, cls=EnumEncoder)} != {json.dumps(expected_json, cls=EnumEncoder)}"
    )


def test_type_model_classes():
    """Test the type model classes."""
    # Test simple type
    simple_type = SimpleType(type_str="str")
    assert simple_type.type_str == "str"
    assert simple_type.kind == TypeKind.SIMPLE
    assert simple_type.description is None

    # Test simple type with description
    simple_type_with_desc = SimpleType(type_str="int", description="A whole number")
    assert simple_type_with_desc.type_str == "int"
    assert simple_type_with_desc.kind == TypeKind.SIMPLE
    assert simple_type_with_desc.description == "A whole number"

    # Test generic type
    generic_type = GenericType(
        type_str="List[str]",
        base_type=SimpleType(type_str="List"),
        parameters=[SimpleType(type_str="str")],
    )
    assert generic_type.type_str == "List[str]"
    assert generic_type.kind == TypeKind.GENERIC
    assert generic_type.description is None
    assert isinstance(generic_type.base_type, SimpleType)
    assert generic_type.base_type.type_str == "List"
    assert len(generic_type.parameters) == 1
    assert isinstance(generic_type.parameters[0], SimpleType)
    assert generic_type.parameters[0].type_str == "str"

    # Test generic type with different kind
    union_type = GenericType(
        type_str="str | int",
        base_type=SimpleType(type_str="Union"),
        parameters=[SimpleType(type_str="str"), SimpleType(type_str="int")],
        kind=TypeKind.UNION,
    )
    assert union_type.type_str == "str | int"
    assert union_type.kind == TypeKind.UNION
    assert isinstance(union_type.base_type, SimpleType)
    assert union_type.base_type.type_str == "Union"
    assert len(union_type.parameters) == 2


def test_json_serialization():
    """Test JSON serialization of type models."""
    # Test simple type
    type_info = SimpleType(type_str="str")

    # Serialize and deserialize
    json_str = type_info.to_json()
    parsed = json.loads(json_str)

    # Check fields are preserved
    assert parsed["type_str"] == "str"
    assert parsed["kind"] == "simple"
    assert parsed["description"] is None

    # Test generic type with nested structure
    nested_type = GenericType(
        type_str="List[Dict[str, int]]",
        base_type=SimpleType(type_str="List"),
        parameters=[
            GenericType(
                type_str="Dict[str, int]",
                base_type=SimpleType(type_str="Dict"),
                parameters=[SimpleType(type_str="str"), SimpleType(type_str="int")],
            )
        ],
    )

    # Verify the JSON structure
    expected_json_snapshot = {
        "kind": "generic",
        "type_str": "List[Dict[str, int]]",
        "description": None,
        "base_type": {"kind": "simple", "type_str": "List", "description": None},
        "parameters": [
            {
                "kind": "generic",
                "type_str": "Dict[str, int]",
                "description": None,
                "base_type": {
                    "kind": "simple",
                    "type_str": "Dict",
                    "description": None,
                },
                "parameters": [
                    {"kind": "simple", "type_str": "str", "description": None},
                    {"kind": "simple", "type_str": "int", "description": None},
                ],
            }
        ],
    }

    # Verify the exact JSON structure matches our expectation
    actual_json = json.loads(nested_type.to_json())
    assert actual_json == expected_json_snapshot, (
        "JSON snapshot does not match expected format"
    )

    # Test enum serialization
    enum_value = TypeKind.UNION
    json_str = json.dumps(enum_value, cls=EnumEncoder)
    assert json_str == '"union"'
