#!/usr/bin/env python3
# Example 25: Validation and Error Handling
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/tools.mdx:1175
# This file is auto-generated; any edits should be made in the source file

from typing import Annotated

from mirascope import BaseTool, llm
from pydantic import AfterValidator, Field, ValidationError


def is_upper(v: str) -> str:
    assert v.isupper(), "Must be uppercase"
    return v


class GetBookAuthor(BaseTool):
    """Returns the author of the book with the given title."""

    title: Annotated[str, AfterValidator(is_upper)] = Field(
        ..., description="The title of the book."
    )

    def call(self) -> str:
        if self.title == "THE NAME OF THE WIND":
            return "Patrick Rothfuss"
        elif self.title == "MISTBORN: THE FINAL EMPIRE":
            return "Brandon Sanderson"
        else:
            return "Unknown"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", tools=[GetBookAuthor])
def identify_author(book: str) -> str:
    return f"Who wrote {book}?"


response = identify_author("The Name of the Wind")
try:
    if tool := response.tool:
        print(tool.call())
    else:
        print(response.content)
except ValidationError as e:
    print(e)
    # > 1 validation error for GetBookAuthor
    #   title
    #     Assertion failed, Must be uppercase [type=assertion_error, input_value='The Name of the Wind', input_type=str]
    #       For further information visit https://errors.pydantic.dev/2.8/v/assertion_error
