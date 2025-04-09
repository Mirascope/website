#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/async.mdx:53
# This file is auto-generated; any edits should be made in the source file

import asyncio

from mirascope import llm


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
async def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


async def main():
    response = await recommend_book("fantasy")
    print(response.content)


asyncio.run(main())
