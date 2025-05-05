#!/usr/bin/env python3
# Example 4: Parallel Async Calls
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/async.mdx:131
# This file is auto-generated; any edits should be made in the source file

import asyncio

from mirascope import llm, prompt_template


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template("Recommend a {genre} book")
async def recommend_book(genre: str): ... # [!code highlight]


async def main():
    genres = ["fantasy", "scifi", "mystery"]
    tasks = [recommend_book(genre) for genre in genres] # [!code highlight]
    results = await asyncio.gather(*tasks) # [!code highlight]

    for genre, response in zip(genres, results):
        print(f"({genre}):\n{response.content}\n")


asyncio.run(main())
