#!/usr/bin/env python3
# Example 5: Async Streaming
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/async.mdx:167
# This file is auto-generated; any edits should be made in the source file

import asyncio

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", stream=True)
async def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


async def main():
    stream = await recommend_book("fantasy")
    async for chunk, _ in stream:
        print(chunk.content, end="", flush=True)


asyncio.run(main())
