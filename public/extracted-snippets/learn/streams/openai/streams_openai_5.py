#!/usr/bin/env python3
# Example 5: Common Stream Properties and Methods
# Generated for provider: openai
# Source: content/docs/mirascope/learn/streams.mdx:171
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini", stream=True)
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


stream = recommend_book("fantasy")
for chunk, _ in stream:
    print(chunk.content, end="", flush=True)

print(f"Content: {stream.content}")

call_response = stream.construct_call_response() # [!code highlight]
print(f"Usage: {call_response.usage}") # [!code highlight]
