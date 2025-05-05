#!/usr/bin/env python3
# Example 1: Basic Usage and Syntax
# Generated for provider: openai
# Source: content/doc/mirascope/learn/async.mdx:54
# This file is auto-generated; any edits should be made in the source file

import asyncio

from mirascope import llm


@llm.call(provider="openai", model="gpt-4o-mini")
async def recommend_book(genre: str) -> str: # [!code highlight]
    return f"Recommend a {genre} book"


async def main():
    response = await recommend_book("fantasy") # [!code highlight]
    print(response.content)


asyncio.run(main())
