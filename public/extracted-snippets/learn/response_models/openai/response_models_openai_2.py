#!/usr/bin/env python3
# Example 2: Basic Usage and Syntax
# Generated for provider: openai
# Source: content/docs/mirascope/learn/response_models.mdx:50
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template
from pydantic import BaseModel


class Book(BaseModel):
    """An extracted book."""

    title: str
    author: str


@llm.call(provider="openai", model="gpt-4o-mini", response_model=Book) # [!code highlight]
@prompt_template("Extract {text}")
def extract_book(text: str): ...


book = extract_book("The Name of the Wind by Patrick Rothfuss")
print(book)
# Output: title='The Name of the Wind' author='Patrick Rothfuss' # [!code highlight]
