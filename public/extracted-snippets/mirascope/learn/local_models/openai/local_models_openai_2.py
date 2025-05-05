#!/usr/bin/env python3
# Example 2: Local (Open-Source) Models
# Generated for provider: openai
# Source: content/doc/mirascope/learn/local_models.mdx:47
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from pydantic import BaseModel


@llm.call("vllm", "llama3.2") # [!code highlight]
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


recommendation = recommend_book("fantasy")
print(recommendation)
# Output: Here are some popular and highly-recommended fantasy books...


class Book(BaseModel):
    title: str
    author: str


@llm.call("vllm", "llama3.2", response_model=Book) # [!code highlight]
def extract_book(text: str) -> str:
    return f"Extract {text}"


book = extract_book("The Name of the Wind by Patrick Rothfuss")
assert isinstance(book, Book)
print(book)
# Output: title='The Name of the Wind' author='Patrick Rothfuss'
