#!/usr/bin/env python3
# Example 28: Validation and Error Handling
# Generated for provider: openai
# Source: content/docs/mirascope/learn/tools.mdx:1319
# This file is auto-generated; any edits should be made in the source file

from typing import Annotated

from mirascope import llm, prompt_template
from pydantic import AfterValidator, ValidationError


def is_upper(v: str) -> str:
    assert v.isupper(), "Must be uppercase"
    return v


def get_book_author(title: Annotated[str, AfterValidator(is_upper)]) -> str: # [!code highlight]
    """Returns the author of the book with the given title

    Args:
        title: The title of the book.
    """
    if title == "THE NAME OF THE WIND":
        return "Patrick Rothfuss"
    elif title == "MISTBORN: THE FINAL EMPIRE":
        return "Brandon Sanderson"
    else:
        return "Unknown"


@llm.call(provider="openai", model="gpt-4o-mini", tools=[get_book_author])
@prompt_template("Who wrote {book}?")
def identify_author(book: str): ...


response = identify_author("The Name of the Wind")
try: # [!code highlight]
    if tool := response.tool:
        print(tool.call())
    else:
        print(response.content)
except ValidationError as e: # [!code highlight]
    print(e)
    # > 1 validation error for GetBookAuthor
    #   title
    #     Assertion failed, Must be uppercase [type=assertion_error, input_value='The Name of the Wind', input_type=str]
    #       For further information visit https://errors.pydantic.dev/2.8/v/assertion_error
