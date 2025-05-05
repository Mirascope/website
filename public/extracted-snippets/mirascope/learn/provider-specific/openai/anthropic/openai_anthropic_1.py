#!/usr/bin/env python3
# Example 1: Tools
# Generated for provider: anthropic
# Source: content/doc/mirascope/learn/provider-specific/openai.mdx:18
# This file is auto-generated; any edits should be made in the source file

from mirascope.core import BaseTool, openai
from mirascope.core.openai import OpenAIToolConfig


class FormatBook(BaseTool):
    title: str
    author: str

    tool_config = OpenAIToolConfig(strict=True) # [!code highlight]

    def call(self) -> str:
        return f"{self.title} by {self.author}"


@openai.call(
    "gpt-4o-2024-08-06", tools=[FormatBook], call_params={"tool_choice": "required"}
)
def recommend_book(genre: str) -> str:
    return f"Recommend a {genre} book"


response = recommend_book("fantasy")
if tool := response.tool:
    print(tool.call())
