#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: openai
# Source: content/docs/mirascope/learn/calls.mdx:30
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini") # [!code highlight]
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book" # [!code highlight]


response: llm.CallResponse = recommend_book("fantasy")
print(response.content)
