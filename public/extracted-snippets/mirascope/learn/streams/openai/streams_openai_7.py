#!/usr/bin/env python3
# Example 7: Provider-Specific Response Details
# Generated for provider: openai
# Source: content/docs/mirascope/learn/streams.mdx:222
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini", stream=True)
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


stream = recommend_book("fantasy")
for chunk, _ in stream:
    print(f"Original chunk: {chunk.chunk}") # [!code highlight]
    print(chunk.content, end="", flush=True)
