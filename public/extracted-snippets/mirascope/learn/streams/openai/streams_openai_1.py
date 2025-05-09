#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: openai
# Source: content/docs/mirascope/learn/streams.mdx:55
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini", stream=True) # [!code highlight]
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


stream = recommend_book("fantasy") # [!code highlight]
for chunk, _ in stream: # [!code highlight]
    print(chunk.content, end="", flush=True) # [!code highlight]
