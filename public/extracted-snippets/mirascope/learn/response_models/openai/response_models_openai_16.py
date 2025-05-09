#!/usr/bin/env python3
# Example 16: Streaming Response Models
# Generated for provider: openai
# Source: content/docs/mirascope/learn/response_models.mdx:673
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template
from pydantic import BaseModel


class Book(BaseModel):
    title: str
    author: str


@llm.call(provider="openai", model="gpt-4o-mini", response_model=Book, stream=True) # [!code highlight]
@prompt_template("Extract {text}")
def extract_book(text: str): ...


book_stream = extract_book("The Name of the Wind by Patrick Rothfuss")
for partial_book in book_stream: # [!code highlight]
    print(partial_book) # [!code highlight]
# Output:
# title=None author=None
# title='' author=None
# title='The' author=None
# title='The Name' author=None
# title='The Name of' author=None
# title='The Name of the' author=None
# title='The Name of the Wind' author=None
# title='The Name of the Wind' author=''
# title='The Name of the Wind' author='Patrick'
# title='The Name of the Wind' author='Patrick Roth'
# title='The Name of the Wind' author='Patrick Rothf'
# title='The Name of the Wind' author='Patrick Rothfuss'
