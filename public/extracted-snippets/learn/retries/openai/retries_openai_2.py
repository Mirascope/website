#!/usr/bin/env python3
# Example 2: Calls
# Generated for provider: openai
# Source: content/docs/mirascope/learn/retries.mdx:47
# This file is auto-generated; any edits should be made in the source file

from mirascope import llm, prompt_template
from tenacity import retry, stop_after_attempt, wait_exponential # [!code highlight]


@retry( # [!code highlight]
    stop=stop_after_attempt(3), # [!code highlight]
    wait=wait_exponential(multiplier=1, min=4, max=10), # [!code highlight]
) # [!code highlight]
@llm.call(provider="openai", model="gpt-4o-mini")
@prompt_template("Recommend a {genre} book")
def recommend_book(genre: str): ...


print(recommend_book("fantasy"))
