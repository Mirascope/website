#!/usr/bin/env python3
# Example 6: Async Streaming
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/async.mdx:188
# This file is auto-generated; any edits should be made in the source file

import asyncio

from mirascope import llm, prompt_template


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", stream=True)
@prompt_template("Recommend a {genre} book")
async def recommend_book(genre: str): ...


async def main():
    stream = await recommend_book("fantasy")
    async for chunk, _ in stream:
        print(chunk.content, end="", flush=True)


asyncio.run(main())
