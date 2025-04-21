#!/usr/bin/env python3
# Example 1: Calls
# Generated for provider: openai
# Source: content/doc/mirascope/learn/retries.mdx:26
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm
from tenacity import retry, stop_after_attempt, wait_exponential


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
)
@llm.call(provider="openai", model="gpt-4o-mini")
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


print(recommend_book("fantasy"))
