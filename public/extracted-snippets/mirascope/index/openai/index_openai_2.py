#!/usr/bin/env python3
# Example 2: Mirascope API
# Generated for provider: openai
# Source: content/docs/mirascope/index.mdx:72
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template
from pydantic import BaseModel


class Book(BaseModel):
    """An extracted book."""
 
    title: str
    author: str


# [!code highlight:6]
@llm.call(
    provider="openai", 
    model="gpt-4o-mini", 
    response_model=Book
) 
@prompt_template("Extract {text}")
def extract_book(text: str): ...


book: Book = extract_book("The Name of the Wind by Patrick Rothfuss") # [!code highlight]
print(book)
# Output: title='The Name of the Wind' author='Patrick Rothfuss' # [!code highlight]
