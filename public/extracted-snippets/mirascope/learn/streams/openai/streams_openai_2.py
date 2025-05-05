#!/usr/bin/env python3
# Example 2: Basic Usage and Syntax
# Generated for provider: openai
# Source: content/doc/mirascope/learn/streams.mdx:70
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini", stream=True) # [!code highlight]
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


stream = recommend_book("fantasy") # [!code highlight]
for chunk, _ in stream: # [!code highlight]
    print(chunk.content, end="", flush=True) # [!code highlight]

print(f"Content: {stream.content}")

call_response = stream.construct_call_response()
print(f"Usage: {call_response.usage}")
