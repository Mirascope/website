#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


response: llm.CallResponse = recommend_book("fantasy")
print(response.content)
