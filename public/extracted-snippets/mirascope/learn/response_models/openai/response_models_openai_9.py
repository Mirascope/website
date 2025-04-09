#!/usr/bin/env python3
# Example 9: Accessing Original Call Response On Error
# Generated for provider: openai
# Source: src/docs/mirascope/learn/response_models.mdx:443
# This file is auto-generated; any edits should be made in the source file

from typing import Annotated

from mirascope import llm
from pydantic import AfterValidator, BaseModel, ValidationError


def validate_upper(v: str) -> str:
    assert v.isupper(), "Field must be uppercase"
    return v


class Book(BaseModel):
    """An extracted book."""

    title: Annotated[str, AfterValidator(validate_upper)]
    author: Annotated[str, AfterValidator(validate_upper)]


@llm.call(provider="openai", model="gpt-4o-mini", response_model=Book)
def extract_book(text: str) -> str:
    return f"Extract {text}"


try:
    book = extract_book("The Name of the Wind by Patrick Rothfuss")
    print(book)
except ValidationError as e:
    print(f"Error: {str(e)}")
    response = e._response  # pyright: ignore[reportAttributeAccessIssue]
    print(response.model_dump())
    # > {'metadata': {}, 'response': {'id': ...}, ...}
