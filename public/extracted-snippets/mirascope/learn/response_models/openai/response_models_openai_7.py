#!/usr/bin/env python3
# Example 7: Validation and Error Handling
# Generated for provider: openai
# Source: content/docs/mirascope/learn/response_models.mdx:351
# This file is auto-generated; any edits should be made in the source file

from typing import Annotated # [!code highlight]

from mirascope import llm
from pydantic import AfterValidator, BaseModel, ValidationError # [!code highlight]


def validate_upper(v: str) -> str: # [!code highlight]
    assert v.isupper(), "Field must be uppercase" # [!code highlight]
    return v # [!code highlight]


class Book(BaseModel):
    """An extracted book."""

    title: Annotated[str, AfterValidator(validate_upper)] # [!code highlight]
    author: Annotated[str, AfterValidator(validate_upper)] # [!code highlight]


@llm.call(provider="openai", model="gpt-4o-mini", response_model=Book)
def extract_book(text: str) -> str:
    return f"Extract {text}"


try: # [!code highlight]
    book = extract_book("The Name of the Wind by Patrick Rothfuss")
    print(book)
    # Output: title='The Name of the Wind' author='Patrick Rothfuss'
except ValidationError as e: # [!code highlight]
    print(f"Error: {str(e)}")
    # Error: 2 validation errors for Book
    # title
    #   Assertion failed, Field must be uppercase [type=assertion_error, input_value='The Name of the Wind', input_type=str]
    #     For further information visit https://errors.pydantic.dev/2.7/v/assertion_error
    # author
    #   Assertion failed, Field must be uppercase [type=assertion_error, input_value='Patrick Rothfuss', input_type=str]
    #     For further information visit https://errors.pydantic.dev/2.7/v/assertion_error
