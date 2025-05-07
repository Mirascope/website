#!/usr/bin/env python3
# Example 33: ToolKit
# Generated for provider: anthropic
# Source: content/docs/mirascope/learn/tools.mdx:1580
# This file is auto-generated; any edits should be made in the source file

from mirascope import (
    BaseDynamicConfig,
    BaseToolKit,
    Messages,
    llm,
)
from mirascope.core import toolkit_tool


class BookTools(BaseToolKit): # [!code highlight]
    __namespace__ = "book_tools" # [!code highlight]

    reading_level: str # [!code highlight]

    @toolkit_tool # [!code highlight]
    def suggest_author(self, author: str) -> str:
        """Suggests an author for the user to read based on their reading level.

        User reading level: {self.reading_level} # [!code highlight]
        Author you suggest must be appropriate for the user's reading level.
        """
        return f"I would suggest you read some books by {author}"


@llm.call(provider="anthropic", model="claude-3-5-sonnet-latest")
def recommend_author(genre: str, reading_level: str) -> BaseDynamicConfig:
    toolkit = BookTools(reading_level=reading_level) # [!code highlight]
    return {
        "tools": toolkit.create_tools(), # [!code highlight]
        "messages": [Messages.User(f"What {genre} author should I read?")],
    }


response = recommend_author("fantasy", "beginner") # [!code highlight]
if tool := response.tool:
    print(tool.call())
    # Output: I would suggest you read some books by J.K. Rowling # [!code highlight]

response = recommend_author("fantasy", "advanced") # [!code highlight]
if tool := response.tool:
    print(tool.call())
    # Output: I would suggest you read some books by Brandon Sanderson # [!code highlight]
