#!/usr/bin/env python3
# Example 4: Common Stream Properties and Methods
# Generated for provider: anthropic
# This file is auto-generated and should not be edited directly

from mirascope import llm, prompt_template


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", stream=True)
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


stream = recommend_book("fantasy")
for chunk, _ in stream:
    print(chunk.content, end="", flush=True)

print(f"Content: {stream.content}")
