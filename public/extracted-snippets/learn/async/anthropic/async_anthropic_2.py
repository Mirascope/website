#!/usr/bin/env python3
# Example 2: Basic Usage and Syntax
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/async.mdx:74
# This file is auto-generated; any edits should be made in the source file

import asyncio

from mirascope import llm, prompt_template


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template("Recommend a {genre} book")
async def recommend_book(genre: str): ... # [!code highlight]


async def main():
    response = await recommend_book("fantasy") # [!code highlight]
    print(response.content)


asyncio.run(main())
