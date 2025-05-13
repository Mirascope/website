#!/usr/bin/env python3
# Example 11: Error Handling
# Generated for provider: openai
# Source: content/docs/mirascope/learn/calls.mdx:486
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini")
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


try:
    response: llm.CallResponse = recommend_book("fantasy") # [!code highlight]
    print(response.content)
except Exception as e:
    print(f"Error: {str(e)}") # [!code highlight]
