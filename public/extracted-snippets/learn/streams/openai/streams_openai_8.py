#!/usr/bin/env python3
# Example 8: Provider-Specific Response Details
# Generated for provider: openai
# Source: content/docs/mirascope/learn/streams.mdx:238
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini", stream=True)
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


stream = recommend_book("fantasy")
for chunk, _ in stream:
    print(f"Original chunk: {chunk.chunk}") # [!code highlight]
    print(chunk.content, end="", flush=True)
