#!/usr/bin/env python3
# Example 5: Common Parameters Across Providers
# Generated for provider: openai
# Source: content/doc/mirascope/learn/calls.mdx:293
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini", call_params={"max_tokens": 512})
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


response: llm.CallResponse = recommend_book("fantasy")
print(response.content)
