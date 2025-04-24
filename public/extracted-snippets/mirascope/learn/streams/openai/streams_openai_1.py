#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: openai
# Source: content/doc/mirascope/learn/streams.mdx:55
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini", stream=True)
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


stream = recommend_book("fantasy")
for chunk, _ in stream:
    print(chunk.content, end="", flush=True)
