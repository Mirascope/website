#!/usr/bin/env python3
# Example 11: JSON Mode
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/response_models.mdx:519
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from pydantic import BaseModel


class Book(BaseModel):
    """An extracted book."""

    title: str
    author: str


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", response_model=Book, json_mode=True) # [!code highlight]
def extract_book(text: str) -> str:
    return f"Extract {text}"


book = extract_book("The Name of the Wind by Patrick Rothfuss")
print(book)
# Output: title='The Name of the Wind' author='Patrick Rothfuss'
