#!/usr/bin/env python3
# Example 4: OpenAI Compatibility
# Generated for provider: openai
# Source: content/docs/mirascope/learn/local_models.mdx:135
# This file is auto-generated; any edits should be made in the source file

from mirascope.core import openai
from openai import OpenAI
from pydantic import BaseModel

custom_client = OpenAI( # [!code highlight]
    base_url="http://localhost:8000/v1",  # your vLLM endpoint # [!code highlight]
    api_key="vllm",  # required by openai, but unused # [!code highlight]
) # [!code highlight]


@openai.call("llama3.2", client=custom_client) # [!code highlight]
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


recommendation = recommend_book("fantasy")
print(recommendation)
# Output: Here are some popular and highly-recommended fantasy books...


class Book(BaseModel):
    title: str
    author: str


@openai.call("llama3.2", response_model=Book, client=custom_client) # [!code highlight]
def extract_book(text: str) -> str:
    return f"Extract {text}"


book = extract_book("The Name of the Wind by Patrick Rothfuss")
assert isinstance(book, Book)
print(book)
# Output: title='The Name of the Wind' author='Patrick Rothfuss'
