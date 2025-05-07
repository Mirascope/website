#!/usr/bin/env python3
# Example 6: Common Stream Properties and Methods
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/streams.mdx:191
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", stream=True)
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


stream = recommend_book("fantasy")
for chunk, _ in stream:
    print(chunk.content, end="", flush=True)

print(f"Content: {stream.content}")

call_response = stream.construct_call_response() # [!code highlight]
print(f"Usage: {call_response.usage}") # [!code highlight]
