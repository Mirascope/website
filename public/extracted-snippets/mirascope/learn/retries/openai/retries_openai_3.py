#!/usr/bin/env python3
# Example 3: Streams
# Generated for provider: openai
# Source: content/docs/mirascope/learn/retries.mdx:80
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from tenacity import retry, stop_after_attempt, wait_exponential # [!code highlight]


@llm.call(provider="openai", model="gpt-4o-mini", stream=True)
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
