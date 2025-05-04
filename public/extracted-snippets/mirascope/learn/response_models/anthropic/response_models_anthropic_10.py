#!/usr/bin/env python3
# Example 10: Accessing Original Call Response On Error
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/response_models.mdx:476
# This file is auto-generated; any edits should be made in the source file

from typing import Annotated

from mirascope import llm, prompt_template
from pydantic import AfterValidator, BaseModel, ValidationError


def validate_upper(v: str) -> str:
    assert v.isupper(), "Field must be uppercase"
    return v


class Book(BaseModel):
    """An extracted book."""

    title: Annotated[str, AfterValidator(validate_upper)]
    author: Annotated[str, AfterValidator(validate_upper)]


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", response_model=Book)
@prompt_template("Extract {text}")
def extract_book(text: str): ...


try:
    book = extract_book("The Name of the Wind by Patrick Rothfuss")
    print(book)
except ValidationError as e:
    response = e._response  # pyright: ignore[reportAttributeAccessIssue] # [!code highlight]
    print(response.model_dump()) # [!code highlight]
    # > {'metadata': {}, 'response': {'id': ...}, ...} # [!code highlight]
