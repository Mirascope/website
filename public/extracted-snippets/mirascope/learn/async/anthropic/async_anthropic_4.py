#!/usr/bin/env python3
# Example 4: Parallel Async Calls
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/async.mdx:130
# This file is auto-generated; any edits should be made in the source file

import asyncio

from mirascope import llm, prompt_template


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template("Recommend a {genre} book")
async def recommend_book(genre: str): ...


async def main():
    genres = ["fantasy", "scifi", "mystery"]
    tasks = [recommend_book(genre) for genre in genres]
    results = await asyncio.gather(*tasks)

    for genre, response in zip(genres, results):
        print(f"({genre}):\n{response.content}\n")


asyncio.run(main())
