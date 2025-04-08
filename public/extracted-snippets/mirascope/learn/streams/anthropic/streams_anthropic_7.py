#!/usr/bin/env python3
# Example 7: Provider-Specific Response Details
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", stream=True)
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


stream = recommend_book("fantasy")
for chunk, _ in stream:
    print(f"Original chunk: {chunk.chunk}")
    print(chunk.content, end="", flush=True)
