#!/usr/bin/env python3
# Example 34: ToolKit
# Generated for provider: anthropic
# Source: src/docs/mirascope/learn/tools.mdx:1628
# This file is auto-generated; any edits should be made in the source file

from mirascope import (
    BaseDynamicConfig,
    BaseToolKit,
    llm,
    prompt_template,
)
from mirascope.core import toolkit_tool


class BookTools(BaseToolKit):
    __namespace__ = "book_tools"

    reading_level: str

    @toolkit_tool
    def suggest_author(self, author: str) -> str:
        """Suggests an author for the user to read based on their reading level.

        User reading level: {self.reading_level}
        Author you suggest must be appropriate for the user's reading level.
        """
        return f"I would suggest you read some books by {author}"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
@prompt_template("What {genre} author should I read?")
def recommend_author(genre: str, reading_level: str) -> BaseDynamicConfig:
    toolkit = BookTools(reading_level=reading_level)
    return {"tools": toolkit.create_tools()}



response = recommend_author("fantasy", "beginner")
if tool := response.tool:
    print(tool.call())
    # Output: I would suggest you read some books by J.K. Rowling

response = recommend_author("fantasy", "advanced")
if tool := response.tool:
    print(tool.call())
    # Output: I would suggest you read some books by Brandon Sanderson
