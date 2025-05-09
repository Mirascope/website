#!/usr/bin/env python3
# Example 6: Async Streaming
# Generated for provider: openai
# Source: content/docs/mirascope/learn/async.mdx:189
# This file is auto-generated; any edits should be made in the source file

import asyncio

from mirascope import llm, prompt_template


@llm.call(provider="openai", model="gpt-4o-mini", stream=True) # [!code highlight]
@prompt_template("Recommend a {genre} book")
async def recommend_book(genre: str): ... # [!code highlight]


async def main():
    stream = await recommend_book("fantasy") # [!code highlight]
    async for chunk, _ in stream: # [!code highlight]
        print(chunk.content, end="", flush=True)


asyncio.run(main())
