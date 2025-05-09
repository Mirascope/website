#!/usr/bin/env python3
# Example 3: Parallel Async Calls
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/async.mdx:107
# This file is auto-generated; any edits should be made in the source file

import asyncio

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
async def recommend_book(genre: str) -> str: # [!code highlight]
    return f"Recommend a {genre} book"


async def main():
    genres = ["fantasy", "scifi", "mystery"]
    tasks = [recommend_book(genre) for genre in genres] # [!code highlight]
    results = await asyncio.gather(*tasks) # [!code highlight]

    for genre, response in zip(genres, results):
        print(f"({genre}):\n{response.content}\n")


asyncio.run(main())
