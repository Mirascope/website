#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: openai
# This file is auto-generated and should not be edited directly

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini")
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


response: llm.CallResponse = recommend_book("fantasy")
print(response.content)
