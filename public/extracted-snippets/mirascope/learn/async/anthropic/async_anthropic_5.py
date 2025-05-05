#!/usr/bin/env python3
# Example 5: Async Streaming
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/async.mdx:168
# This file is auto-generated; any edits should be made in the source file

import asyncio

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", stream=True) # [!code highlight]
async def recommend_book(genre: str) -> str: # [!code highlight]
    return f"Recommend a {genre} book"


async def main():
    stream = await recommend_book("fantasy") # [!code highlight]
    async for chunk, _ in stream: # [!code highlight]
        print(chunk.content, end="", flush=True)


asyncio.run(main())
