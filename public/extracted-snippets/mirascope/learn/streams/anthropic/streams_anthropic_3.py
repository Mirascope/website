#!/usr/bin/env python3
# Example 3: Common Stream Properties and Methods
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/streams.mdx:131
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", stream=True)
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


stream = recommend_book("fantasy")
for chunk, _ in stream:
    print(chunk.content, end="", flush=True)

print(f"Content: {stream.content}")
