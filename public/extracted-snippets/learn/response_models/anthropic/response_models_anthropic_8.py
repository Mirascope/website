#!/usr/bin/env python3
# Example 8: Validation and Error Handling
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/response_models.mdx:391
# This file is auto-generated; any edits should be made in the source file

from typing import Annotated # [!code highlight]

from mirascope import llm, prompt_template
from pydantic import AfterValidator, BaseModel, ValidationError # [!code highlight]


def validate_upper(v: str) -> str:
    assert v.isupper(), "Field must be uppercase"
    return v


class Book(BaseModel):
    """An extracted book."""

    title: Annotated[str, AfterValidator(validate_upper)] # [!code highlight]
    author: Annotated[str, AfterValidator(validate_upper)] # [!code highlight]


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", response_model=Book)
@prompt_template("Extract {text}")
def extract_book(text: str): ...


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
