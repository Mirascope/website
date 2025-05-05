#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: openai
# Source: content/doc/mirascope/learn/response_models.mdx:27
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from pydantic import BaseModel


class Book(BaseModel):
    """An extracted book."""
 
    title: str
    author: str


@llm.call(provider="openai", model="gpt-4o-mini", response_model=Book) # [!code highlight]
def extract_book(text: str) -> str:
    return f"Extract {text}"


book = extract_book("The Name of the Wind by Patrick Rothfuss")
print(book)
# Output: title='The Name of the Wind' author='Patrick Rothfuss' # [!code highlight]
