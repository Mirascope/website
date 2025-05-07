#!/usr/bin/env python3
# Example 7: Async Tools
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/async.mdx:221
# This file is auto-generated; any edits should be made in the source file

import asyncio

from mirascope import BaseTool, llm


class FormatBook(BaseTool):
    title: str
    author: str

    async def call(self) -> str: # [!code highlight]
        # Simulating an async API call
        await asyncio.sleep(1)
        return f"{self.title} by {self.author}"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest", tools=[FormatBook]) # [!code highlight]
async def recommend_book(genre: str) -> str: # [!code highlight]
    return f"Recommend a {genre} book"


async def main():
    response = await recommend_book("fantasy")
    if tool := response.tool:
        if isinstance(tool, FormatBook): # [!code highlight]
            output = await tool.call() # [!code highlight]
            print(output)
    else:
        print(response.content)


asyncio.run(main())
