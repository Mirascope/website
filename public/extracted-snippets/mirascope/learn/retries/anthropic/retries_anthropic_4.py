#!/usr/bin/env python3
# Example 4: Streams
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/retries.mdx:105
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template
from tenacity import retry, stop_after_attempt, wait_exponential


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", stream=True)
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


@retry( # [!code highlight]
    stop=stop_after_attempt(3), # [!code highlight]
    wait=wait_exponential(multiplier=1, min=4, max=10), # [!code highlight]
) # [!code highlight]
def stream():
    for chunk, _ in recommend_book("fantasy"):
        print(chunk.content, end="", flush=True)


stream()
