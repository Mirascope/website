#!/usr/bin/env python3
# Example 2: Response Models
# Generated for provider: openai
# Source: content/docs/mirascope/learn/provider-specific/openai.mdx:51
# This file is auto-generated; any edits should be made in the source file

from mirascope.core import ResponseModelConfigDict, openai
from pydantic import BaseModel


class Book(BaseModel):
    title: str
    author: str

    model_config = ResponseModelConfigDict(strict=True)


@openai.call("gpt-4o-2024-08-06", response_model=Book, json_mode=True)
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


book = recommend_book("fantasy")
print(book)
