#!/usr/bin/env python3
# Example 2: Mirascope API
# Generated for provider: anthropic
# Source: src/docs/mirascope/getting-started/why.mdx:85
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template
from pydantic import BaseModel


class Book(BaseModel):
    title: str
    author: str


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", response_model=Book)
@prompt_template("Extract {text}")
def extract_book(text: str): ...


book: Book = extract_book("The Name of the Wind by Patrick Rothfuss")
print(book)
# Output: title='The Name of the Wind' author='Patrick Rothfuss'
