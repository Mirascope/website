#!/usr/bin/env python3
# Example 3: Streams
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/retries.mdx:80
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from tenacity import retry, stop_after_attempt, wait_exponential # [!code highlight]


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", stream=True)
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


@retry( # [!code highlight]
    stop=stop_after_attempt(3), # [!code highlight]
    wait=wait_exponential(multiplier=1, min=4, max=10), # [!code highlight]
) # [!code highlight]
def stream():
    for chunk, _ in recommend_book("fantasy"):
        print(chunk.content, end="", flush=True)


stream()
